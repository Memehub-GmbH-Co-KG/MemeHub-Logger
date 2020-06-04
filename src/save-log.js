const { Subscriber } = require('redis-request-broker');
const { serializeError } = require('serialize-error');
const { instance: LoggerInstance, component: LoggerComponent } = require('./instance');
const moment = require('moment');

async function start(queue, targets, levels, targetErrorTimeout) {

    if (typeof queue !== 'string')
        throw new Error('Cannot init logger: Invalid parameter: queue');

    if (!Array.isArray(targets))
        throw new Error('Cannot init logger: Invalid parameter: targets');

    if (!levels || !levels.hierarchy || !levels.mapping || !levels.internal)
        throw new Error('Cannot init logger: Invalid parameter: levels');

    if (typeof targetErrorTimeout !== 'number')
        throw new Error('Cannot init logger: Invalid parameter: targetErrorTimeout');

    subscriber = new Subscriber(queue, handleLog);
    let inactiveTargets = [];
    await subscriber.listen();

    async function handleLog(log) {
        try {
            const time = moment();
            const level = levels.mapping[log.level];
            const component = log.component;
            const instance = log.instance;
            const title = log.title;
            const data = log.data;

            if (typeof level !== 'string')
                throw new Error('Invalid log level');

            if (typeof component !== 'string')
                throw new Error('Invalid log component');

            if (typeof instance !== 'string')
                throw new Error('Invalid log instance');

            if (typeof title !== 'string')
                throw new Error('Invalid log title');

            await sendLog(time, level, component, instance, title, data);

        }
        catch (error) {
            console.log(error);
            await sendLog(moment(), levels.internal.onUnknownLevel, LoggerComponent, LoggerInstance, 'Invalid log request', { error, log });
            throw error; // Pass the error to the client
        }

    }

    /**
     * Sends a log to all currently active targets.
     * 
     * Targets may become inactive when they fail to handle a log.
     * 
     * @param {*} time The time of the log (moment js object)
     * @param {string} level The level of the log. It is assumed to be valid.
     * @param {string} component The component that issued the log
     * @param {string} instance The instnace that issued the log
     * @param {string} title The log headline
     * @param {object} data The log data (optional)
     */
    async function sendLog(time, level, component, instance, title, data) {
        // Convert errors to something usefull
        if (data instanceof Error)
            data = serializeError(data);

        // Send to every target that matches the level
        const errors = [];
        for (const target of targets) {
            try {
                // Skip if level is to low
                const hierarchy = levels.hierarchy[level];
                if (hierarchy > target.level)
                    continue;

                // Skip disabled targets
                if (inactiveTargets.includes(target))
                    continue;

                // Send log to target
                await target.log(time, level, component, instance, title, data);
            }
            catch (error) {
                // The logging targets should never throw. Therfore something went pretty bad.
                // Temporarly disable the target and log the incident, hoping that some 
                // logging target is still working.
                inactiveTargets = inactiveTargets.concat(target);
                setTimeout(() => {
                    inactiveTargets = inactiveTargets.filter(t => t !== target)
                }, targetErrorTimeout);
                errors.push(serializeError(error));
            }
        }

        // Log if targets failed to handle the log
        if (errors.length > 0) {
            await sendLog(moment(), levels.internal.onTargetFailedToHandle, LoggerInstance, LoggerComponent, 'Targets failed to handle a log', {
                errors,
                log: { time, level, component, instance, title, data }
            });
        }
    }

    return {
        stop: async function () {
            await subscriber.stop();
        },
        sendLog
    }
}

module.exports.start = start;

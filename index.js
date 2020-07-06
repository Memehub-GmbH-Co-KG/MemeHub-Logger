const { Defaults } = require('redis-request-broker');
const saveLogs = require('./src/save-log');
const instance = require('./src/instance');
const yaml = require('js-yaml');
const fs = require('fs');
const moment = require('moment');
const _eventLogger = require('./src/event-logger');

const targets = {
    console: require('./src/targets/console'),
    cache: require('./src/targets/cache'),
    mongodb: require('./src/targets/mongodb'),
    telegram: require('./src/targets/telegram')
}

let activeTargets = [];
let logs = { sendLog: () => { } };
let eventLogger = undefined;
let shuttingDown = false;

async function init() {
    // Check if running
    if (activeTargets.length > 0 || logs.sendLog)
        await stop();

    console.log('Starting up...');

    // Read config on startup
    let config;
    try {
        config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));
    } catch (e) {
        console.error('Error: Cannot load config file. Exiting.');
        process.exit(1);
    }

    // Set rrb defaults
    Defaults.setDefaults({
        redis: config.rrb.redis
    });

    // Initialize logging targets
    activeTargets = [];
    for (const targetConfig of config.targets) {
        if (!targetConfig.enabled)
            continue;

        try {
            const level = config.levels.hierarchy[targetConfig.level];

            if (typeof level !== 'number')
                throw new Error(`Invlaid log level: ${targetConfig.level}`);

            const target = await targets[targetConfig.type].build(targetConfig || {});
            target.level = level;

            activeTargets.push(target);
        }
        catch (error) {

            console.error('Failed to initialize logging target. Aborting init.');
            console.error(error);
            console.log('Logging target that caused this error:');
            console.log(targetConfig);

            await stop();
            throw error;
        }
    }

    logs = await saveLogs.start(config.rrb.logChannel, activeTargets, config.levels, config.targetErrorTimeout);

    // Event logging
    if (config.events && config.events.logEvents)
        eventLogger = await _eventLogger.build(config.events, logs.sendLog);

    logs.sendLog(moment(), 'notice', instance.component, instance.instance, 'Startup complete.');
    console.log('Startup complete.');
}

async function stop() {
    if (shuttingDown)
        return;

    shuttingDown = true;
    console.log('Shutting down...');

    eventLogger && await eventLogger.stop()
        .catch(e => sendLog(moment(), 'warning', instance.component, instance.instance, 'Faield to stop event logger', e));

    try {
        if (logs.stop) {
            await logs.sendLog(moment(), 'notice', instance.component, instance.instance, 'Shutting down.');
            await logs.stop();
        }
        logs = { sendLog: () => { } };
    }
    catch (error) {
        console.error(`Failed to stopp logging: ${error.message}`);
    }

    for (const t of activeTargets) {
        try {
            await t.stop();
        }
        catch (error) {
            console.error('Failed to stop logging target.');
            console.error(error);
        }
    }
    activeTargets = [];
    shuttingDown = false;
    console.log('Shutdown complete.');
}


init().catch(error => {
    console.log(`Failed to start: ${error.message}`);
    console.log(error);
    stop();
});

process.on('SIGINT', stop);
process.on('SIGQUIT', stop);
process.on('SIGTERM', stop);

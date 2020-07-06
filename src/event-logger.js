const { Subscriber } = require('redis-request-broker');
const moment = require('moment');
const i = require('./instance');

module.exports.build = async function(config, sendLog) {
    if (!config.logEvents)
        return { stop: async () => {}};
    
    let subscribers = [];

    try {
        for (const event of config.channels) {
            const sub = new Subscriber(`${config.prefix}:${event}`, async eventData => {
                await sendLog(moment(), config.level, i.component, i.instance, `Event '${event}'`, { event, eventData });
            });
            subscribers.push(sub);
            await sub.listen();
        }
    }

    catch (error) {
        await stop();
        throw error;
    }

    async function stop() {
        for (const sub of subscribers)
            await sub.stop().catch(e => sendLog(moment(), 'warning', i.component, i.instance, 'Failed to stop subscriber', error));
    }

    return { stop };
}
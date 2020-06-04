const { Defaults } = require('redis-request-broker');
const saveLogs = require('./src/save-log');
const instance = require('./src/instance');
const yaml = require('js-yaml');
const fs = require('fs');
const moment = require('moment');

const targets = {
    console: require('./src/targets/console'),
    cache: require('./src/targets/cache'),
    mongodb: require('./src/targets/mongodb'),
    telegram: require('./src/targets/telegram')
}

async function init() {

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
    const activeTargets = [];
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
        catch(error) {
            for (const t of activeTargets)
                await t.stop();

            console.error('Failed to initialize all logging targets: ' + error.message)
            throw error;
        }
    }

    const logs = await saveLogs.start(config.rrb.queues.log, activeTargets, config.levels, config.targetErrorTimeout);
    logs.sendLog(moment(), 'info', instance.component, instance.instance, 'Startup complete', {});
}

init();


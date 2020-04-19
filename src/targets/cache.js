const logCache = require('../log-cache'); 

/**
 * Provides logging to the cache by keeping the logs in memory.
 * This can be used for log retrival.
 * 
 * Config:
 * 
 * size: The amount of logs to keep in the cache.
 * name: The name of the cache. Using multiple instances with the same name
 *       might lead to undefined behavior.
 * 
 * @param {*} config 
 */

async function build(config) {

    // Validate config and set defaults
    if (typeof config.size !== 'number')
        config.size = 100;

    if (typeof config.name !== 'string')
        config.name = 'default';

    // init the cache
    let cache = logCache.initCache(config.name, config.size);

    // Build the logging target
    return {
        log: async function(time, level, component, instance, title, data) {
            cache.add({time, level, component, instance, title, data});
        },

        stop: async function() {
            logCache.deleteCache(config.name);
            cache = undefined;
        }
    }
}

module.exports.build = build;
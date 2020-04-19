const { serializeError } = require('serialize-error');

/**
 * Provides logging to the output stream / console.
 * 
 * Config:
 * 
 * indentation: String to put before each line of datail data
 * timestamp: A formatting string for the timestamp. [Moment js `format`](https://momentjs.com/docs/#/displaying/format/) is used
 * @param {*} config 
 */

async function build(config) {

    // Validate config and set defaults
    if (typeof config.indentation !== 'string')
        config.indentation = '  ] ';

    if (typeof config.timestamp !== 'string')
        config.timestamp = 'DD.MM.YYYY HH:mm:ss.SSS';

    // Build the logging target
    return {
        log: async function(time, level, component, instance, title, data) {
            const timestamp = time.format(config.timestamp);
            console.log(`${timestamp} [${component}][${instance}][${names[level]}]: ${title}`);
            if (data) console.log(`${indented(readable(data))}`);
        },

        stop: async function() {
            // Nothing
        }
    }

    function indented(json_string) {
        return `${config.indentation}${json_string.replace(/(?:\r\n|\r|\n)/g, `\n${config.indentation}`)}`;
    }

    function readable(data) {
        if (typeof data === 'string') return data;
        if (data instanceof Error) data = serializeError(data);
        return JSON.stringify(data, null, '  ');
    }

}
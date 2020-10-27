const { serializeError } = require('serialize-error');
const Telegraf = require('telegraf')

/**
 * Provides logging to telegram groups.
 * 
 * Config:
 * 
 * token: The telegram bot token that is used to send the log message.
 * chats: An array of group ids to which the log messages should be send to.
 * timestamp: A formatting string for the timestamp. [Moment js `format`](https://momentjs.com/docs/#/displaying/format/) is used.
 * 
 * @param {*} config 
 */

async function build(config, full_config) {

    // Validate config and set defaults
    if (typeof full_config.telegram.bot_token !== 'string')
        throw new Error('Cannot build telegram logging target: Invalid bot token.');

    if (!Array.isArray(config.chats) || !config.chats.every(c => typeof c === 'number'))
        throw new Error('Cannot build telegram logging target: Chats invalid');

    if (typeof config.timestamp !== 'string')
        config.timestamp = 'DD.MM.YYYY HH:mm:ss';

    const bot = new Telegraf(full_config.telegram.bot_token);
    const logQueue = [];
    const timeoutWaitingToLog = undefined;

    // Build the logging target
    return {
        log: async function (time, level, component, instance, title, data) {
            await sendLog({ time, level, component, instance, title, data });
        },

        stop: async function () {
            if (!timeoutWaitingToLog)
                return;

            // Warn about logs in logQueue
            clearTimeout(timeoutWaitingToLog);
            console.warn("Stopped while waiting to send telegram logs. The following logs will not be sent:");
            for (const log of logQueue)
                console.log(log);
        }
    }

    async function sendLog(log) {
        try {
            // Dont send log now if we are pausing the logging right now
            if (timeoutWaitingToLog)
                return logQueue.push(log);

            let message = `_${escape(log.time.format(config.timestamp))} · __${escape(log.component)}__ ${escape(log.instance)}_\n*${log.level}:* ${escape(log.title)}`;
            if (log.data)
                message = `${message}\n\`${escape(readable(log.data))}\``;

            for (id of config.chats)
                await bot.telegram.sendMessage(id, message, { parse_mode: 'MarkdownV2' });
        }
        catch (error) {
            // Check, for too many requests error
            if (error && error.code === 429)
                return onTooMAnyRequests(error, log);

            console.error('Failed to send log to telegram', error);
        }
    }

    /**
     * Escapes an input string to work with markdown.
     * See [the docs](https://core.telegram.org/bots/api#markdownv2-style).
     * @param {string} text The text to escape.
     */
    function escape(text) {
        const escapeCharacters = [
            [/\_/g, '\\_'],
            [/\*/g, '\\*'],
            [/\[/g, '\\['],
            [/\]/g, '\\]'],
            [/\(/g, '\\('],
            [/\)/g, '\\)'],
            [/\~/g, '\\~'],
            [/\`/g, '\\`'],
            [/\>/g, '\\>'],
            [/\#/g, '\\#'],
            [/\+/g, '\\+'],
            [/\-/g, '\\-'],
            [/\=/g, '\\='],
            [/\|/g, '\\|'],
            [/\{/g, '\\{'],
            [/\}/g, '\\}'],
            [/\./g, '\\.'],
            [/\!/g, '\\!']
        ];
        for (const char of escapeCharacters)
            text = text.replace(char[0], char[1]);
        return text;
    }

    function readable(data) {
        if (data instanceof Error) data = serializeError(data);
        return JSON.stringify(data, null, '  ');
    }

    function onTooMAnyRequests(error, log) {
        try {
            logQueue.push(log);

            // Just queue the log, if there is an timeout
            if (timeoutWaitingToLog)
                return;

            // Get time to wait
            const time = error.parameters && error.parameters.retry_after
                ? error.parameters.retry_after
                : 60;

            timeoutWaitingToLog = setTimeout(emptyLogQueue, time * 1000);
        }
        catch (error) {
            console.error("Failed to handle too many requests error:", error);
        }
    }

    async function emptyLogQueue() {
        try {
            timeoutWaitingToLog = undefined;
            while (logQueue.length > 0)
                await sendLog(logQueue.shift());
        }
        catch (error) {
            console.error("Failed to empty log queue:", error);
        }
    }
}

module.exports.build = build;
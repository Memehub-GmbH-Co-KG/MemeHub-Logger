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

async function build(config) {

    // Validate config and set defaults
    if (typeof config.token !== 'string')
        throw new Error('Cannot build telegram logging target: Invalid bot token.');

    if (!Array.isArray(config.chats) || !config.chats.every(c => typeof c === 'number'))
        throw new Error('Cannot build telegram logging target: Chats invalid');

    if (typeof config.timestamp !== 'string')
        config.timestamp = 'DD.MM.YYYY HH:mm:ss';

    const bot = new Telegraf(config.token);

    // Build the logging target
    return {
        log: async function (time, level, component, instance, title, data) {
            // Wrap in try catch as we dont really mind if it does not work
            try {
                let message = `_${escape(time.format(config.timestamp))} · __${escape(component)}__ ${escape(instance)}_\n*${level}:* ${escape(title)}`;
                if (data)
                    message = `${message}\n\`${escape(readable(data))}\``;

                for (id of config.chats)
                    await bot.telegram.sendMessage(id, message, { parse_mode: 'MarkdownV2' });
            }
            catch (error) {
                console.error('Failed to send log to telegram', error);
            }
        },

        stop: async function () {
            // Nothing
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
}

module.exports.build = build;
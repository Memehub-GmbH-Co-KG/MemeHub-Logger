const MongoClient = require('mongodb').MongoClient;

/**
 * Stores logs in a mongodb.
 * This can be used for log retrival.
 * 
 * Uses the base config mongo db settings.
 * 
 * @param {any} _ Target config not used
 * @param {object} full_config The full memehub bot config
 */

async function build(_, full_config) {

    // Validate config and set defaults
    if (typeof full_config.mongodb.connection !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid connection string');

    if (typeof full_config.mongodb.database !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid database');

    if (typeof full_config.mongodb.collections.logs !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid collection');

    // Connect to mongodb
    const client = new MongoClient(full_config.mongodb.connection, { useUnifiedTopology: true, useNewUrlParser: true });
    const connection = await client.connect();

    // Create the collection in case it does not exist yet.
    const database = client.db(full_config.mongodb.database);
    const collection = await database.createCollection(full_config.mongodb.collections.logs, {});

    console.log('mdb init');

    // Build the logging target
    return {
        log: async function (time, level, component, instance, title, data) {
            try {
                await collection.insertOne({ time: time.toDate(), level, component, instance, title, data });
            }
            catch (error) {
                console.error('Cannot insert log into mongodb:', error);
            }
        },

        stop: async function () {
            try {
                await connection.close();
            }
            catch (error) {
                console.error('Cannot disconnect from mongodb:', error);
            }
        }
    }
}

module.exports.build = build;
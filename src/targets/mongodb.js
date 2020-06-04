const MongoClient = require('mongodb').MongoClient;

/**
 * Stores logs in a mongodb.
 * This can be used for log retrival.
 * 
 * Config:
 * 
 * connection: The mongodb connection string
 * database: The database to use
 * collection: The collection to store the logs in.
 * 
 * 
 * @param {*} config 
 */

async function build(config) {

    // Validate config and set defaults
    if (typeof config.connection !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid connection string');

    if (typeof config.database !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid database');

    if (typeof config.collection !== 'string')
        throw new Error('Cannot build mongodb logging target: Invalid collection');

    // Connect to mongodb
    const client = new MongoClient(config.connection, { useUnifiedTopology: true, useNewUrlParser: true });
    const connection = await client.connect();

    // Create the collection in case it does not exist yet.
    const database = client.db(config.database);
    const collection = await database.createCollection(config.collection);

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
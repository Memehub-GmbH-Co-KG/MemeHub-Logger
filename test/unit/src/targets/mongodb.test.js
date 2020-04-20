const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const mongodbTarget = require('../../../../src/targets/mongodb');
const moment = require('moment');
const yaml = require('js-yaml');
const fs = require('fs');
const config = yaml.safeLoad(fs.readFileSync('config.test.yaml', 'utf8'));
const MongoClient = require('mongodb').MongoClient;

chai.should();
chai.use(chaiAsPromised);


describe('target mongodb', function() {

    before(async function() {
        this.timeout(5000); // Connecting might take a while

        this.config = config.targets.find(t => t.type === 'mongodb');
        this.client = new MongoClient(this.config.connection, { useUnifiedTopology: true });
        this.connection = await this.client.connect().should.be.fulfilled;
        this.database = this.client.db(this.config.database);
        this.collection = this.database.collection(this.config.collection);
        
        await this.collection.deleteMany({});
        
        this.target = await mongodbTarget.build(this.config).should.be.fulfilled;
        
    });

    after(async function() {
        await this.connection.close().should.be.fulfilled;
        await this.target.stop().should.be.fulfilled;
    });

    it('should store a log', async function() {
        this.slow(200);
        const time = moment();
        const args = [ time, 'TEST', 'Logger', 'Test instance', 'Telegram test log', { test: 'data'} ];
        await this.target.log(...args).should.be.fulfilled;
        const logs = await this.collection.find({}).toArray().should.be.fulfilled;

        logs.length.should.eq(1);
        const log = logs[0];
        log._id.should.not.be.undefined;
        delete log._id;
        log.should.deep.eq(
            { time: time.toDate(), level: 'TEST', component: 'Logger', instance: 'Test instance', title: 'Telegram test log', data: {test: 'data'}  }
        );
    });
});
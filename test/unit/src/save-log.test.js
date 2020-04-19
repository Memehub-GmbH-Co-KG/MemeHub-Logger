const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Publisher, Defaults } = require('redis-request-broker');
const { start } = require('../../../src/save-log');
const yaml = require('js-yaml');
const fs = require('fs');
const sleep = require('util').promisify(setTimeout);
const config = yaml.safeLoad(fs.readFileSync('config.test.yaml', 'utf8'));

chai.should();
chai.use(chaiAsPromised);

const mockTarget = function(failing = false) {
    const log = {};
    return {
        l: log,
        log: async function(time, level, component, instance, title, data) {
            log.time = time;
            log.level = level;
            log.component = component;
            log.instance = instance;
            log.title = title;
            log.data = data;

            if (failing)
                throw new Error('Failed test log target');
        },
        stop() {},
        level: 1
    }
}


describe('save log', async function () {

    before(async function() {
        
        Defaults.setDefaults({
            redis: config.rrb.redis
        })
        this.publisher = new Publisher(config.rrb.queues.log, { minimumRecipients: 1 });
        await this.publisher.connect().should.be.fulfilled;
    });

    after(async function() {
        await this.publisher.disconnect().should.be.fulfilled;
    });

    

    it('should pass a log to a logging target', async function() {
        const t = mockTarget();
        const logger = await start(config.rrb.queues.log, [ t ], config.levels, config.targetErrorTimeout);
        try {
            const data = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title', data: { test: 'data' }};
            await this.publisher.publish(data).should.be.fulfilled;
            await sleep(10);
            t.l.level.should.eq(data.level);
            t.l.component.should.eq(data.component);
            t.l.instance.should.eq(data.instance);
            t.l.title.should.eq(data.title);
            t.l.data.should.deep.eq(data.data);
            t.l.time.should.not.be.null;
        }
        finally {
            await logger.stop().should.be.fulfilled;
        }
    });


    it('should not pass a log to a logging target with a lower level', async function() {
        const t = mockTarget();
        const logger = await start(config.rrb.queues.log, [ t ], config.levels, config.targetErrorTimeout);
        try {
            const data = { level: 'info', component: 'test component', instance: 'test instance', title: 'test title', data: { test: 'data' }};
            await this.publisher.publish(data).should.be.fulfilled;
            await sleep(10);
            if (typeof t.l.level !== 'undefined')
                throw new Error('Log should not be received.');
        }
        finally {
            await logger.stop().should.be.fulfilled;
        }
    });

    it('should pass a log to multiple logging targets', async function() {
        const t1 = mockTarget();
        const t2 = mockTarget();
        const t3 = mockTarget();
        const logger = await start(config.rrb.queues.log, [ t1, t2, t3 ], config.levels, config.targetErrorTimeout);
        try {
            const data = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title', data: { test: 'data' }};
            await this.publisher.publish(data).should.be.fulfilled;
            await sleep(10);
            t1.l.title.should.eq(data.title);
            t2.l.title.should.eq(data.title);
            t3.l.title.should.eq(data.title);
        }
        finally {
            await logger.stop().should.be.fulfilled;
        }
    });

    it('should handle multiple logs', async function() {
        const t = mockTarget();
        const logger = await start(config.rrb.queues.log, [ t ], config.levels, config.targetErrorTimeout);
        try {
            const data1 = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title', data: { test: 'data' }};
            const data2 = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title 2', data: { test: 'data' }};
            await this.publisher.publish(data1).should.be.fulfilled;
            await sleep(10);
            t.l.title.should.eq(data1.title);
            await this.publisher.publish(data2).should.be.fulfilled;
            await sleep(10);
            t.l.title.should.eq(data2.title);
        }
        finally {
            await logger.stop().should.be.fulfilled;
        }
    });

    it('should handle the failure of a logging target', async function() {
        const t1 = mockTarget();
        const t2 = mockTarget(true);
        const logger = await start(config.rrb.queues.log, [ t1, t2 ], config.levels, config.targetErrorTimeout);
        try {
            const data1 = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title 1', data: { test: 'data' }};
            const data2 = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title 2', data: { test: 'data' }};
            const data3 = { level: 'error', component: 'test component', instance: 'test instance', title: 'test title 3', data: { test: 'data' }};
            
            // First publish: The failing target should receive the log
            await this.publisher.publish(data1).should.be.fulfilled;
            await sleep(10);
            t1.l.title.should.eq('Targets failed to handle a log');
            t1.l.data.errors[0].message.should.eq('Failed test log target');
            t1.l.data.log.title.should.eq(data1.title);
            t2.l.title.should.eq(data1.title);

            // Second publish: The failing target should NOT receive the log
            await this.publisher.publish(data2).should.be.fulfilled;
            await sleep(10);
            t1.l.title.should.eq(data2.title);
            t2.l.title.should.eq(data1.title);

            await sleep(50);
            
            // Third publish after timeout: Target should be active again
            await this.publisher.publish(data3).should.be.fulfilled;
            await sleep(10);
            t1.l.title.should.eq('Targets failed to handle a log');
            t2.l.title.should.eq(data3.title);
            
        }
        finally {
            await logger.stop().should.be.fulfilled;
        }
    });
});
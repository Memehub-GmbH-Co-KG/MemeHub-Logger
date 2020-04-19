const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const logCache = require('../../../../src/log-cache');
const cacheTarget = require('../../../../src/targets/cache');
const moment = require('moment');

chai.should();
chai.use(chaiAsPromised);


describe('target cache', function() {

    before(function() {
        
    });

    after(function() {
        
    });

    beforeEach(async function() {
        this.targetDefault = await cacheTarget.build({}).should.be.fulfilled;
        this.targetFive = await cacheTarget.build({ name: 'five', size: 5 }).should.be.fulfilled;
        this.targetVar = await cacheTarget.build({ name: 'var' }).should.be.fulfilled;
        this.cache = logCache.getCache('default');
        this.cacheFive = logCache.getCache('five');
        this.cacheVar = logCache.getCache('var');
    });

    afterEach(async function() {
        await this.targetDefault.stop().should.be.fulfilled;
        await this.targetFive.stop().should.be.fulfilled;
        await this.targetVar.stop().should.be.fulfilled;
        delete this.targetDefault;
        delete this.targetFive;
        delete this.targetVar;
        delete this.cache;
        delete this.cacheFive;
        delete this.cacheVar;
    })

    it('should send a log to the cache', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', { test: 'data'} ];
        await this.targetDefault.log(...args).should.be.fulfilled;
        Array.from(this.cache.getAll()).should.deep.eq([{ 
            time,
            level: 'level', 
            component: 'test component',
            instance: 'test instance',
            title: 'test title',
            data: { test: 'data' }
        }]); 
    });

    it('should use the size parameter', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', { test: 'data'} ];
        for (const _ of Array(10))
            await this.targetFive.log(...args).should.be.fulfilled;

        Array.from(this.cacheFive.getAll()).length.should.eq(5);
    });

    it('should use the name parameter', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', { test: 'data'} ];
        
        await this.targetDefault.log(...args).should.be.fulfilled;
        await this.targetVar.log(...args).should.be.fulfilled;

        Array.from(this.cache.getAll()).length.should.eq(1);
    });

});
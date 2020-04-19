const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const logCache = require('../../../src/log-cache');

chai.should();
chai.use(chaiAsPromised);



describe('log cache', async function () {

    beforeEach(async function() {
        this.cache = logCache.initCache('test-log-cache', 5);
    });

    afterEach(async function() {
        logCache.deleteCache('test-log-cache');
        delete this.cache;
    });

    it('should cache a log message', function() {
        this.cache.add('test log');
        Array.from(this.cache.getAll()).should.deep.eq(['test log']);
    });

    it('should preserve the order of multiple logs', function() {
        for (const i of Array(5).keys())
            this.cache.add(i);
        
        Array.from(this.cache.getAll()).should.deep.eq([4, 3, 2 , 1, 0]);
    });

    it('should not cache more logs than specified', function() {
        for (const i of Array(500).keys())
            this.cache.add(i);
        
        Array.from(this.cache.getAll()).should.deep.eq([499, 498, 497 , 496, 495]);
    });

    it('should still work after clearig', function() {
        this.cache.add('log');
        this.cache.clear();
        this.cache.add('new log');
        
        Array.from(this.cache.getAll()).should.deep.eq(['new log']);
    });

    it('should be able to return a limited amount of logs', function() {
        for (const i of Array(5).keys())
            this.cache.add(i);

        Array.from(this.cache.get(3)).should.deep.eq([4, 3, 2]);        
    });

    it('should be able to share caches', function() {
        this.cache.add('test log');
        const c2 = logCache.getCache('test-log-cache');

        Array.from(c2.getAll()).should.deep.eq(['test log']);  
    });

});
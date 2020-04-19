const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const yaml = require('js-yaml');
const fs = require('fs');
const moment = require('moment');

const consoleTarget = require('../../../../src/targets/console');

chai.should();
chai.use(chaiAsPromised);


describe('target console', function() {

    before(function() {
        this.oldLog = console.log;
        let logs = [];
        this.logs = logs;
        console.log = function(...args) {
            logs.push(args);
        }

    });

    after(function() {
        console.log = this.oldLog;
    });

    beforeEach(async function() {
        this.logs.length = 0;
        this.instnace = await consoleTarget.build({}).should.be.fulfilled;
    });

    afterEach(async function() {
        await this.instnace.stop().should.be.fulfilled;
    })

    it('should print a log to the console', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', { test: 'data' } ];
        await this.instnace.log(...args);

        this.logs.should.deep.eq([
            [ `${time.format('DD.MM.YYYY HH:mm:ss.SSS')} [test component][test instance][level]: test title` ],
            [ `  ] {\n  ]   \"test\": "data"\n  ] }`]
        ]);
    });

    it('should print a log without data', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', undefined ];
        await this.instnace.log(...args);

        this.logs.should.deep.eq([
            [ `${time.format('DD.MM.YYYY HH:mm:ss.SSS')} [test component][test instance][level]: test title` ]
        ]);
    });

    it('should use the timestamp config', async function() {
        const instnace = await consoleTarget.build({ timestamp: 'HH-mm-ss-SSS' }).should.be.fulfilled;
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', undefined ];
        await instnace.log(...args);

        this.logs.should.deep.eq([
            [ `${time.format('HH-mm-ss-SSS')} [test component][test instance][level]: test title` ]
        ]);
        await instnace.stop();
    });

    it('should use the indentation config', async function() {
        const instnace = await consoleTarget.build({ indentation: '>' }).should.be.fulfilled;
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', { test: 'data' } ];
        await instnace.log(...args);

        this.logs.should.deep.eq([
            [ `${time.format('DD.MM.YYYY HH:mm:ss.SSS')} [test component][test instance][level]: test title` ],
            [ `>{\n>  \"test\": "data"\n>}`]
        ]);
        await instnace.stop();
    });

    it('should handle error as data', async function() {
        const time = moment();
        const args = [ time, 'level', 'test component', 'test instance', 'test title', new Error('test error') ];
        await this.instnace.log(...args);

        this.logs[0].should.deep.eq(
            [ `${time.format('DD.MM.YYYY HH:mm:ss.SSS')} [test component][test instance][level]: test title` ]
        );

        this.logs[1][0].includes('\"name\": \"Error\"').should.be.true;
        this.logs[1][0].includes('\"message\": \"test error\"').should.be.true;
        this.logs[1][0].includes('\"stack\": \"Error: test error').should.be.true;
        
    });

});
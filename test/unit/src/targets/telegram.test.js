const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const telegramTarget = require('../../../../src/targets/telegram');
const moment = require('moment');
const yaml = require('js-yaml');
const fs = require('fs');
const config = yaml.safeLoad(fs.readFileSync('config.test.yaml', 'utf8'));

chai.should();
chai.use(chaiAsPromised);


describe('target telegram', function() {

    it('check weather the a log can be send to telegram!');

    it('Not fail when sending a log', async function() {
        return; // Comment out to atually send a log to telegram

        const t = await telegramTarget.build(config.targets.find(t => t.type === 'telegram'));
        const time = moment();
        const args = [ time, 'TEST', 'Logger', 'Test instance', 'Telegram test log', { test: 'data'} ];
        await t.log(...args).should.be.fulfilled;
    });
});
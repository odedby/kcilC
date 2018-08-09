const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const Redis = require('../src/database');
let db;

describe('Database module test', () => {
	beforeEach('Reset redis client', () => {
		const PORT = '';
		const HOST = '';
		const SRC = 'src';
		const scraper = {};
		db = new Redis(PORT, HOST, SRC, scraper);
	});

	describe('Flush database', () => {
		it('should call Redis client flush method', () => {
			const spy = sinon.spy();
			db._flushall = spy;
			db._flushData();
			expect(spy.calledOnce).to.be.true;
		});
	});

	describe('Reset scrape key', () => {
		let setStub;
		let expireStub;

		beforeEach('Setup stub methods', () => {
			setStub = sinon.stub().returns(Promise.resolve());
			expireStub = sinon.stub().returns(Promise.resolve());
			db._set = setStub;
			db._expire = expireStub;
		});

		it('should set scrape key', (done) => {
			db._resetScrapeKey().then(() => {
				expect(setStub.calledOnce).to.be.true;
				expect(setStub.firstCall.args[0]).to.equal('scrape');
				expect(setStub.firstCall.args[1]).to.equal('scraping trigger');
				done();
			});
		});

		it('should expire scrape key', (done) => {
			db._resetScrapeKey().then(() => {
				expect(expireStub.calledOnce).to.be.true;
				expect(expireStub.firstCall.args[0]).to.equal('scrape');
				expect(expireStub.firstCall.args[1]).to.equal(3600);
				done();
			});
		});
	});

	describe('Update data', () => {
		let resetStub;
		let scrapeStub;
		let storeStub;

		beforeEach('Setup stub methods', () => {
			resetStub = sinon.stub().returns(Promise.resolve());
			scrapeStub = sinon.stub().returns(Promise.resolve('json'));
			db._scraper = {
				scrape: scrapeStub,
			};
			storeStub = sinon.stub().returns(Promise.resolve());
			db._resetScrapeKey = resetStub;
			db._storeJson = storeStub;
		});

		it('should reset scrape key', (done) => {
			db._updateData().then(() => {
				expect(resetStub.calledOnce).to.be.true;
				done();
			});
		});

		it('should scrape data', (done) => {
			db._updateData().then(() => {
				expect(scrapeStub.calledOnce).to.be.true;
				expect(scrapeStub.firstCall.args[0]).to.equal('src');
				done();
			});
		});

		it('should store data', (done) => {
			db._updateData().then(() => {
				expect(storeStub.calledOnce).to.be.true;
				expect(storeStub.firstCall.args[0]).to.equal('json');
				done();
			});
		});
	});

	describe('Get person by extention', () => {
		it('should call hgetall with correct params', (done) => {
			const hgetallStub = sinon.stub().returns(Promise.resolve('person'));
			db._hgetall = hgetallStub;
			db.getPersonByExt('123', 'israel').then((res) => {
				expect(hgetallStub.calledOnce).to.be.true;
				expect(hgetallStub.firstCall.args[0]).to.equal('person:israel:123');
				expect(res).to.equal('person');
				done();
			});
		});
	});

	describe('Get person by name', () => {
		it('should call get with correct params', (done) => {
			const getStub = sinon.stub().returns(Promise.resolve('person'));
			db._get = getStub;
			const name = 'King T`challa';
			db.getPersonByName(name).then((res) => {
				expect(getStub.calledOnce).to.be.true;
				expect(getStub.firstCall.args[0]).to.equal(
					'person:' + name.toLowerCase()
				);
				expect(res).to.equal('person');
				done();
			});
		});
	});

	describe('Get persons', () => {
		it('should call zrange with correct params', (done) => {
			const zrangeStub = sinon.stub().returns(Promise.resolve('persons json'));
			db._zrange = zrangeStub;
			db.getPersons().then((res) => {
				expect(zrangeStub.calledOnce).to.be.true;
				expect(zrangeStub.firstCall.args[0]).to.equal('persons');
				expect(zrangeStub.firstCall.args[1]).to.equal(0);
				expect(zrangeStub.firstCall.args[2]).to.equal(-1);
				expect(res).to.equal('persons json');
				done();
			});
		});
	});

	describe('Get stats', () => {
		it('should call hgetall with correct params', (done) => {
			const hgetallStub = sinon.stub().returns(Promise.resolve('stats'));
			db._hgetall = hgetallStub;
			db.getStats().then((res) => {
				expect(hgetallStub.calledOnce).to.be.true;
				expect(hgetallStub.firstCall.args[0]).to.equal('countries');
				expect(res).to.equal('stats');
				done();
			});
		});
	});

	describe('Store json of all employees', () => {
		it('should call _storePerson with correct params', (done) => {
			const storePersonStub = sinon.stub().returns(Promise.resolve());
			db._storePerson = storePersonStub;
			const emp = {
				fullName: 'Emp 1',
			};
			const list = [emp];
			db._storeJson(list).then(() => {
				expect(storePersonStub.calledOnce).to.be.true;
				expect(storePersonStub.firstCall.args[0]).to.equal(emp);
				done();
			});
		});

		it('should store all given employees', (done) => {
			const storePersonStub = sinon.stub().returns(Promise.resolve());
			db._storePerson = storePersonStub;
			const list = [
				{
					fullName: 'Emp 1',
				},
				{
					fullName: 'Emp 2',
				},
				{
					fullName: 'Emp 3',
				},
			];
			db._storeJson(list).then(() => {
				expect(storePersonStub.calledThrice).to.be.true;
				done();
			});
		});
	});

	describe('Store json of single employee', () => {
		let hmsetStub;
		let setStub;
		let hincrbyStub;
		let person;

		beforeEach('Setup methods and test person', () => {
			hmsetStub = sinon.stub().returns(Promise.resolve());
			setStub = sinon.stub().returns(Promise.resolve());
			zaddStub = sinon.stub().returns(Promise.resolve(1));
			hincrbyStub = sinon.stub().returns(Promise.resolve());
			db._hmset = hmsetStub;
			db._set = setStub;
			db._zadd = zaddStub;
			db._hincrby = hincrbyStub;
			person = {
				fullName: 'Emp 1',
				country: 'Wakanda',
				ext: '123',
				phone: '1111',
				phoneMobile: '2222',
				title: 'Test Employee',
			};
		});

		it('should call hmset with correct params', (done) => {
			db._storePerson(person).then(() => {
				expect(hmsetStub.calledOnce).to.be.true;
				expect(hmsetStub.firstCall.args[0]).to.equal('person:wakanda:123');
				expect(hmsetStub.firstCall.args[1]).to.equal(person);
				done();
			});
		});

		it('should call set with correct params', (done) => {
			db._storePerson(person).then(() => {
				expect(setStub.calledOnce).to.be.true;
				expect(setStub.firstCall.args[0]).to.equal('person:emp 1');
				expect(setStub.firstCall.args[1]).to.equal('Wakanda:123');
				done();
			});
		});

		it('should call zadd with correct params', (done) => {
			db._storePerson(person).then(() => {
				expect(zaddStub.calledOnce).to.be.true;
				expect(zaddStub.firstCall.args[0]).to.equal('persons');
				expect(zaddStub.firstCall.args[1]).to.equal(0);
				expect(zaddStub.firstCall.args[2]).to.equal('Emp 1');
				done();
			});
		});

		it('should call hincrby with correct params', (done) => {
			db._storePerson(person).then(() => {
				expect(hincrbyStub.calledOnce).to.be.true;
				expect(hincrbyStub.firstCall.args[0]).to.equal('countries');
				expect(hincrbyStub.firstCall.args[1]).to.equal('wakanda');
				expect(hincrbyStub.firstCall.args[2]).to.equal(1);
				done();
			});
		});

		it('should not call hincrby if person already in sorted set', (done) => {
			zaddStub = sinon.stub().returns(Promise.resolve(0));
			db._zadd = zaddStub;
			db._storePerson(person).then(() => {
				expect(hincrbyStub.called).to.be.false;
				done();
			});
		});
	});
});

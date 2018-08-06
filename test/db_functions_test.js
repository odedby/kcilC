const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const dbFunctions = require('../src/db_functions.js');

describe('Get person by extention', () => {
	describe('Base test', () => {
		it('should get key "person:israel:1234" from db', (done) => {
			db = {
				hgetall: sinon.spy(),
			};
			ext = '1234';
			country = 'israel';
			dbFunctions.getPersonByExt(db, ext, country).then(() => {
				expect(db.hgetall.calledOnce).to.be.true;
				expect(db.hgetall.firstCall.args[0]).to.equal('person:israel:123');
				done();
			});
		});
	});

	describe('Success case', () => {
		it('should return "person"', () => {
			db = {
				hgetall: sinon.stub().returns('person'),
			};
			ext = '1234';
			country = 'israel';
			return expect(dbFunctions.getPersonByExt(db, ext, country)).to.eventually.equal('person');
		});
	});

	describe('Failure case', () => {
		it('should reject with "error"', () => {
			db = {
				hgetall: sinon.stub().throws('error'),
			};
			ext = '1234';
			country = 'israel'
			return expect(dbFunctions.getPersonByExt(db, ext, country)).to.eventually.be.rejectedWith('error');
		});
	});
});

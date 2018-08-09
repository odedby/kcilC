const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const sinon = require('sinon');
const Scraper = require('../src/scraper');
let scraper = new Scraper();

describe('Scraper test', () => {
	beforeEach('Reset scraper obj', () => {
		scraper = new Scraper();
	});

	describe('Format json from xml', () => {
		it('should call extractPerson once for each entry', (done) => {
			const stub = sinon.stub(scraper, '_extractPerson');
			scraper
				._formatJsonFromXml({
					viewentries: {
						viewentry: [{}, {}, {}],
					},
				})
				.then(() => {
					expect(stub.calledThrice).to.be.true;
					done();
				});
		});
	});

	describe('Extract person', () => {
		it('should correctly extract details from given raw json', (done) => {
			scraper._parseXml('./test/test_data.xml').then((res) => {
				const rawPerson = res.viewentries.viewentry[0];
				const person = scraper._extractPerson(rawPerson);
				expect(person).to.have.property('fullName', 'Test Contact C');
				expect(person).to.have.property('country', 'Israel');
				expect(person).to.have.property('title', 'This is a test');
				expect(person).to.have.property('ext', '333');
				expect(person).to.have.property('phone', '333333333');
				expect(person).to.have.property('phoneMobile', '3333333333');
			});
			done();
		});
	});
});

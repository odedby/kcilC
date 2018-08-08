const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../src/app.js');
let server;

describe('API Test', () => {
	before('Initialize server with static XML data', (done) => {
		app().then((res) => {
			server = res;
			done();
		});
	});

	describe('POST /getPersonByExt', () => {
		describe('Get existing user', () => {
			it('should return json containing single contact', (done) => {
				let person = {
					ext: 222,
					country: 'israel',
				};
				request(server)
					.post('/getPersonByExt')
					.send(person)
					.expect('Content-Type', /json/)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						const json = res.body;
						expect(json.fullName).to.equal('Test Contact B');
						expect(json.ext).to.equal('222');
						expect(json.country).to.equal('Israel');
						expect(json.title).to.equal('This is a test');
						expect(json.phone).to.equal('222222222');
						expect(json.phoneMobile).to.equal('2222222222');
						done();
					});
			});

			it('should return a different contact when changing country', (done) => {
				let person = {
					ext: 222,
					country: 'wakanda',
				};
				request(server)
					.post('/getPersonByExt')
					.send(person)
					.expect('Content-Type', /json/)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						const json = res.body;
						expect(json.fullName).to.equal('Test Contact D');
						expect(json.ext).to.equal('222');
						expect(json.country).to.equal('Wakanda');
						expect(json.title).to.equal('This is a test');
						expect(json.phone).to.equal('');
						expect(json.phoneMobile).to.equal('');
						done();
					});
			});
		});

		describe('Get a non-existing user', () => {
			it('should return status code 404, "Contact not found"', (done) => {
				let person = {
					ext: 1234213,
					country: 'israel',
				};
				request(server)
					.post('/getPersonByExt')
					.send(person)
					.expect('Content-Type', /json/)
					.expect(404)
					.expect('"Contact not found"')
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});
	});

	describe('GET /getPersons', () => {
		it('should return all employees in database', (done) => {
			request(server)
				.get('/getPersons')
				.expect('Content-Type', /json/)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body).to.include.members([
						'Test Contact A',
						'Test Contact B',
						'Test Contact C',
						'Test Contact D',
					]);
					expect(res.body).to.be.of.length(4);
					done();
				});
		});

		it('should return a sorted list', (done) => {
			request(server)
				.get('/getPersons')
				.expect('Content-Type', /json/)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					testOrder = (arr) => {
						let sorted = 1;
						for (let i = 0; i < arr.length - 1; i++) {
							let r = arr[i].localeCompare(arr[i + 1]);
							sorted = sorted && (r === -1 ? 1 : 0);
						}
						return sorted;
					};
					if (!testOrder(res.body)) {
						throw new Error(
							'AssertionError: expected list to be lexicographically sorted'
						);
					}
					done();
				});
		});
	});

	describe('GET /persons/:fullName', () => {
		it('should return json containing single contact', (done) => {
			const name = 'Test Contact C';
			const expectedResp = 'Israel:333';
			request(server)
				.get('/persons/' + name)
				.expect('Content-Type', /json/)
				.expect(200)
				.end((err, res) => {
					if (err) return done(err);
					expect(res.body).to.equal(expectedResp);
					done();
				});
		});
	});

	describe('GET /stats', () => {
		describe('Get existing user', () => {
			it('should return count statistics for countries', (done) => {
				request(server)
					.get('/stats')
					.expect('Content-Type', /json/)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						expect(res.body).to.deep.equal({
							israel: '3',
							wakanda: '1',
						});
						done();
					});
			});
		});

		describe('Get a non-existing user', () => {
			it('should return 404, "Contact not found"', (done) => {
				request(server)
					.get('/persons/nonexistingname')
					.expect('Content-Type', /json/)
					.expect(404)
					.expect('"Contact not found"')
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});
	});
});

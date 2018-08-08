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
					ext: 662,
					country: 'israel',
				};
				request(server)
					.post('/getPersonByExt')
					.send(person)
					.expect('Content-Type', /json/)
					.expect(200)
					.end((err, res) => {
						if (err) return done(err);
						done();
					});
			});
		});

		describe('Get a non-existing user', () => {
			it('should return status code 404, user not found', (done) => {
				let person = {
					ext: 1234213,
					country: 'israel',
				};
				request(server)
					.post('/getPersonByExt')
					.send(person)
					.expect('Content-Type', /json/)
					.expect(404)
					.expect('"User not found"')
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
					expect(res.body).to.be.of.length(728);
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
					const first = res.body[0];
					const middle = res.body[res.body.length / 2];
					const last = res.body[res.body.length - 1];
					expect(first, 'first list entry').to.not.be.undefined;
					expect(middle, 'middle list entry').to.not.be.undefined;
					expect(last, 'last list entry').to.not.be.undefined;
					if (
						res.body[0].localeCompare(res.body[res.body.length / 2]) > 0 ||
						res.body[res.body.length / 2].localeCompare(
							res.body[res.body.length - 1]
						) > 0
					) {
						throw new Error(
							'AssertionError: expected list to be lexicographically sorted'
						);
					}
					done();
				});
		});
	});
});

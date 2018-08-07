const express = require('express');
const app = express();
const Redis = require('./database');
const Scraper = require('./scraper');

const HOST = process.env.REDIS_HOST || 'host.docker.internal';
const PORT = 6379;
const SRC = './data.xml';
const scraper = new Scraper();
const db = new Redis(PORT, HOST, SRC, scraper);

app.use(express.json());

app.post('/getPersonByExt', (req, res) => {
	let json = req.body;
	db.getPersonByExt(json.ext, json.country).then(
		(result) => res.send(result),
		(ex) => {
			console.log('Failed to retrieve person by extention: ' + ex);
		}
	);
});

app.get('/getPersons', (req, res) => {
	db.getPersons().then(
		(result) => res.send(result),
		(ex) => {
			console.log('Failed to retrieve person: ' + ex);
		}
	);
});

app.get('/persons/:fullName', (req, res) => {
	db.getPersonByName(req.params.fullName).then(
		(result) => {
			res.send(result);
		},
		(ex) => {
			console.log('Failed to retrieve person by name: ' + ex);
		}
	);
});

app.get('/stats', (req, res) => {
	db.getStats().then(
		(result) => res.send(result),
		(ex) => {
			console.log('Failed to retrieve stats');
		}
	);
});

module.exports = app;

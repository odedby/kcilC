const express = require('express');
const app = express();
const dbFunctions = require('./db_functions');
const scraper = require('./scraper');

import Redis from './database';

const HOST = process.env.REDIS_HOST || 'host.docker.internal';
const PORT = 6379;
const SRC = '../data.xml';
const db = new Redis(PORT, HOST, SRC, scraper);

app.use(express.json());

app.post('/getPersonByExt', (req, res) => {
	let json = req.body;
	dbFunctions.getPersonByExt(db, json.ext, json.country).then((result) => res.send(result), (ex) => {
		console.log('Failed to retrieve person by extention: ' + ex);
	});
});

app.get('/getPersons', (req, res) => {
	dbFunctions.getPersons(db).then((result) => res.send(result), (ex) => {
		console.log('Failed to retrieve person: ' + ex);
	});
});

app.get('/persons/:fullName', (req, res) => {
	dbFunctions.getPersonByName(db, req.params.fullName)
		.then((result) => {
			res.send(result);
		}, (ex) => {
			console.log('Failed to retrieve person by name: ' + ex);
		});
});

app.get('/stats', (req, res) => {
	dbFunctions.getStats(db).then((result) => res.send(result), (ex) => {
		console.log('Failed to retrieve stats');
	});
});

module.exports = app;

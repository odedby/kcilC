const express = require('express');
const app = express();
const dbFunctions = require('./db_functions');
const scraper = require('./scraper');
const host = process.env.REDIS_HOST || 'host.docker.internal';
const port = 6379;
const db = redis.createClient(port, host);
const sub = redis.createClient(port, host);
const initRedis = require('./initRedis');
initRedis(db, sub, updateDb);
updateDb(db);

function updateDb(db) {
	dbFunctions.resetScrapeKey(db).catch((ex) => {
		console.log('Failed to reset scrape key: ' + ex);
	});
	scraper.parseXml('./data.xml')
		.then((res) => {
			return scraper.formatJson(res);
		})
		.then((res) => {
			return dbFunctions.storeJson(db, res);
		})
		.then(() => console.log('Database update succeeded'))
		.catch((err) => {
			console.log('Error when storing person: ' + err);
		});
}

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

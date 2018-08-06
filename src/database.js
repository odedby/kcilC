const redis = require('redis');
const {promisify} = require('util');

/**
 * Encapsulating class for Redis database functions.
 */
export default class Redis {
	/**
	 * Constructor for a Redis object.
	 * @param {int} port Redis server port.
	 * @param {string} host Redis server host.
	 * @param {string} src Data source to populate Redis with.
	 * @param {object} scraper Scraper to parse data fetched from src.
	 */
	constructor(port, host, src, scraper) {
		this._port = port;
		this._host = host;
		this._src = src;
		this._scraper = scraper;
		_init().then(() => _updateData());
	}

	/**
	 * Initialize client object: create client and
	 * subscribe to expiry event of trigger key.
	 * @return {Promise} Promise that resolves when init is done.
	 */
	_init() {
		this._client = redis.createClient(this._port, this._host);
		this._hmset = promisify(db.hmset).bind(db);
		this._set = promisify(db.set).bind(db);
		this._zadd = promisify(db.zadd).bind(db);
		this._hincrby = promisify(db.hincrby).bind(db);
		this._hgetall = promisify(db.hgetall).bind(db);
		this._zrange = promisify(db.zrange).bind(db);
		this._expire = promisify(db.expire).bind(db);
		const sub = redis.createClient(this._port, this._host);
		const sendCommand = promisify(this._client.send_command).bind(this._client);
		return sendCommand('config', ['set', 'notify-keyspace-events', 'Ex']).then(
			(res) => {
				const event = '__keyevent@0__:expired';
				sub.subscribe(event, () => {
					console.log('Subscribed to "' + event + '" event channel: ' + res);
					sub.on('message', (chn, msg) => {
						if (msg == 'scrape') {
							_updateData();
						}
					});
				});
			}
		);
	}

	/**
	 * Asynchronously update Redis data against given source.
	 * @return {Promise} Promise that resolves when data update is done.
	 */
	_updateData() {
		return Promise.all([
			_resetScrapeKey().catch((ex) => {
				console.log('Failed to reset scrape trigger: ' + ex);
			}),
			this._scraper
				.parseXml(this._src)
				.then(this._scraper.formatJson)
				.then(_storeJson)
				.then(() => console.log('Database update succeeded'))
				.catch((ex) => console.log('Failed to update database: ' + ex)),
		]);
	}

	/**
	 * Reset scraping trigger key in db.
	 * @return {Promise} Promise that resolves when key has been reset.
	 */
	_resetScrapeKey() {
		const KEY = 'scrape';
		const VAL = 'scraping trigger';
		const TIMEOUT_SEC = 3600;

		return set(KEY, VAL).then(() => expire(KEY, TIMEOUT_SEC));
	}

	/**
	 * Get employee by extention and country.
	 * @param {string} ext Company phone extension.
	 * @param {string} country Country of ext.
	 * @return {Promise} Promise that represents contact JSON.
	 */
	getPersonByExt(ext, country) {
		key = 'person:' + country.toLowerCase() + ':' + ext;
		return hgetall(key);
	}

	/**
	 * Get employee by full name.
	 * @param {string} name Full name of employee.
	 * @return {Promise} Promise that represents contact JSON.
	 */
	getPersonByName(name) {
		key = 'person:' + name.toLowerCase();
		return get(key);
	}

	/**
	 * Get all company employees sorted lexicographically.
	 * @return {Promise} Promise that represents JSON which includes
	 * 					 all company employees.
	 */
	getPersons() {
		return zrange('persons', 0, -1);
	}

	/**
	 * Get statistics of employee counts in every country.
	 * @return {Promise} Promise that represents JSON which includes
	 * 					 employee count in every country.
	 */
	getStats() {
		return hgetall('countries');
	}

	/**
	 * Store formatted JSON data in db.
	 * @param {json} json Formatted JSON of employees.
	 * @return {Promise} Promise that resolves when operation is done.
	 */
	_storeJson(json) {
		promises = [];
		for (let person of json) {
			promises.push(storePerson(person));
		}
		return Promise.all(promises);
	}

	/**
	 * Store formatted JSON of a single employee in db.
	 * @param {json} person Formatted JSON of single employee.
	 * @return {Promise} Promise that resolves when operation is done.
	 */
	_storePerson(person) {
		const personExtKey = `person:${person.country.toLowerCase()}:${person.ext}`;
		const personNameKey = `person:${person.fullName.toLowerCase()}`;
		const personsKey = 'persons';
		const countriesKey = 'countries';
		const personNameVal = `${person.country}:${person.ext}`;

		return Promise.all([
			hmset(personExtKey, person),
			set(personNameKey, personNameVal),
			zadd(personsKey, 0, person.fullName).then((res) => {
				if (res === 1) hincrby(countriesKey, person.country.toLowerCase(), 1);
			}),
		]);
	}
}

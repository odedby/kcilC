const redis = require('redis');
const {promisify} = require('util');

/**
 * Encapsulating class for Redis database functions.
 */
module.exports = class Redis {
	/**
	 * Constructor for a Redis object.
	 * @param {int} port Redis server port.
	 * @param {string} host Redis server host.
	 * @param {string} src Data source to populate Redis with.
	 * @param {object} scraper Scraper to parse data fetched from src.
	 * @param {callback} cb Callback to execute when initialization is done.
	 */
	constructor(port, host, src, scraper, cb = () => {}) {
		this._port = port;
		this._host = host;
		this._src = src;
		this._scraper = scraper;
	}

	/**
	 * Initialize redis connection: create client and
	 * subscribe to expiry event of trigger key.
	 * @return {Promise} Promise that resolves when init is done.
	 */
	init() {
		this._client = redis.createClient(this._port, this._host);
		const sub = redis.createClient(this._port, this._host);
		return this._promisify()
			.then(() =>
				this._sendCommand('config', ['set', 'notify-keyspace-events', 'Ex'])
			)
			.then((res) => this._subscribeToExpiry(sub, res))
			.then(() => this._flushData())
			.then(() => this._updateData());
	}

	/**
	 * Flush data from Redis.
	 * @return {Promise} Promise that resolves when done.
	 */
	_flushData() {
		return this._flushall();
	}

	/**
	 * Subscribe to scraping trigger expiration event.
	 * @param {client} sub Client to subscribe with.
	 * @param {string} res Response to notification request.
	 * @return {Promise} Promise that resolves when done.
	 */
	_subscribeToExpiry(sub, res) {
		return new Promise((fulfill, reject) => {
			const event = '__keyevent@0__:expired';
			sub.subscribe(event, () => {
				console.log('Subscribed to "' + event + '" event channel: ' + res);
				sub.on('message', (chn, msg) => {
					if (msg == 'scrape') {
						this._updateData();
					}
				});
			});
			fulfill();
		});
	}

	/**
	 * Promisify all required Redis methods.
	 * @return {Promise} Promise that resolves when done.
	 */
	_promisify() {
		return new Promise((fulfill, reject) => {
			this._hmset = promisify(this._client.hmset).bind(this._client);
			this._set = promisify(this._client.set).bind(this._client);
			this._get = promisify(this._client.get).bind(this._client);
			this._zadd = promisify(this._client.zadd).bind(this._client);
			this._hincrby = promisify(this._client.hincrby).bind(this._client);
			this._hgetall = promisify(this._client.hgetall).bind(this._client);
			this._zrange = promisify(this._client.zrange).bind(this._client);
			this._expire = promisify(this._client.expire).bind(this._client);
			this._sendCommand = promisify(this._client.send_command).bind(
				this._client
			);
			this._flushall = promisify(this._client.flushall).bind(this._client);
			fulfill();
		});
	}

	/**
	 * Asynchronously update Redis data against given source.
	 * @return {Promise} Promise that resolves when data update is done.
	 */
	_updateData() {
		return Promise.all([
			this._resetScrapeKey().catch((ex) => {
				console.log('Failed to reset scrape trigger: ' + ex);
			}),
			this._scraper
				.scrape(this._src)
				.then((res) => this._storeJson(res))
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

		return this._set(KEY, VAL).then(() => this._expire(KEY, TIMEOUT_SEC));
	}

	/**
	 * Get employee by extention and country.
	 * @param {string} ext Company phone extension.
	 * @param {string} country Country of ext.
	 * @return {Promise} Promise that represents contact JSON.
	 */
	getPersonByExt(ext, country) {
		const key = 'person:' + country.toLowerCase() + ':' + ext;
		return this._hgetall(key);
	}

	/**
	 * Get employee by full name.
	 * @param {string} name Full name of employee.
	 * @return {Promise} Promise that represents contact JSON.
	 */
	getPersonByName(name) {
		const key = 'person:' + name.toLowerCase();
		return this._get(key);
	}

	/**
	 * Get all company employees sorted lexicographically.
	 * @return {Promise} Promise that represents JSON which includes
	 * 					 all company employees.
	 */
	getPersons() {
		return this._zrange('persons', 0, -1);
	}

	/**
	 * Get statistics of employee counts in every country.
	 * @return {Promise} Promise that represents JSON which includes
	 * 					 employee count in every country.
	 */
	getStats() {
		return this._hgetall('countries');
	}

	/**
	 * Store formatted JSON data in db.
	 * @param {json} json Formatted JSON of employees.
	 * @return {Promise} Promise that resolves when operation is done.
	 */
	_storeJson(json) {
		const promises = [];
		for (let person of json) {
			promises.push(this._storePerson(person));
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
			this._hmset(personExtKey, person),
			this._set(personNameKey, personNameVal),
			this._zadd(personsKey, 0, person.fullName).then((res) => {
				if (res === 1) {
					this._hincrby(countriesKey, person.country.toLowerCase(), 1);
				}
			}),
		]);
	}
};

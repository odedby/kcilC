const fs = require('fs');
const xml2js = require('xml2js');
const {promisify} = require('util');
const readFile = promisify(fs.readFile);
const parseString = promisify(xml2js.parseString);

/**
 * Employee data scraper.
 */
module.exports = class Scraper {
	/**
	 * Empty default constructor for Scraper.
	 */
	constructor() {}

	/**
	 * Extract employee data from given source.
	 * @param {string} src Data source.
	 * @return {Promise} Promise that represents formatted employee data.
	 */
	scrape(src) {
		return this._parseXml(src).then((res) => this._formatJsonFromXml(res));
	}

	/**
	 * Fetch XML data from source file and convert it to JSON.
	 * @param {string} src Source file path.
	 * @return {json} Raw JSON of given XML.
	 */
	_parseXml(src) {
		return readFile(src).then(parseString);
	}

	/**
	 * Format raw JSON from given XML into structured employee data.
	 * @param {json} json Raw JSON from XML source.
	 * @return {Promise} Promise that represents formatted JSON.
	 */
	_formatJsonFromXml(json) {
		json = json.viewentries.viewentry;
		return new Promise((fulfill, reject) => {
			const res = [];
			for (let entry of json) {
				res.push(this._extractPerson(entry));
			}
			fulfill(res);
		});
	}

	/**
	 * Extracts a single properly formatted contact from unformatted JSON entry.
	 * @param {json} entry JSON entry as extracted from source data.
	 * @return {json} Formatted JSON contact.
	 */
	_extractPerson(entry) {
		let data = entry.entrydata;
		return {
			fullName: data[0].text[0],
			title: data[3].text[0],
			country: data[2].text[0],
			ext: data[4].text[0],
			phone: data[5].text[0],
			phoneMobile: data[6].text[0],
		};
	}
};

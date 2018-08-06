const fs = require('fs');
const parseString = require('xml2js').parseString;

module.exports.parseXml = (src) => {
	return new Promise((fulfill, reject) => {
		fs.readFile(src, (ex, res) => {
			if (ex) {
				reject(ex);
			} else {
				parseString(res, (err, result) => {
					if (err) {
						reject(err);
					} else {
						fulfill(result.viewentries.viewentry);
					}
				});
			}
		});
	});
};

module.exports.formatJson = (json) => {
	return new Promise((fulfill, reject) => {
		res = [];
		for (let entry of json) {
			res.push(extractPerson(entry));
		}
		fulfill(res);
	});
};

function extractPerson(entry) {
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

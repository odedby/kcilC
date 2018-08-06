var exports = module.exports = {}
exports.getPersonByExt = (db, ext, country) => {
    return new Promise((fulfill, reject) => {
        key = 'person:' + country.toLowerCase() + ':' + ext
        db.hgetall(key, (err, res) => {
            if(err) {
                reject(err)
            } else {
                fulfill(res)
            }
        })
    })
}

exports.getPersons = (db) => {
    return new Promise((fulfill, reject) => {
        db.zrange('persons', 0, -1, (err, res) => {
            if(err) {
                reject(err)
            } else {
                fulfill(res)
            }
        })
    })
}

exports.getPersonByName = (db, name) => {
    return new Promise((fulfill, reject) => {
        key = "person:" + name.toLowerCase()
        db.get(key, (err, res) => {
            if(err) {
                reject(err)
            } else {
                fulfill(res)
            }
        })
    })
}

exports.getStats = (db) => {
    return new Promise((fulfill, reject) => {
        const countriesKey = 'countries'
        db.hgetall(countriesKey, (err, res) => {
            if(err) {
                reject(err)
            } else {
                fulfill(res)
            }
        })
    })
}

exports.storeJson = (db, json) => {
    promises = []
    for(var person of json) {
        promises.push(storePerson(db, person))
    }
    return Promise.all(promises)
}

storePerson = (db, person) => {
    return new Promise((fulfill, reject) => {
        const personExtKey = `person:${person.country.toLowerCase()}:${person.ext}`
        const personNameKey = `person:${person.fullName.toLowerCase()}`
        const personsKey = 'persons'
        const countriesKey = 'countries'
        const cb = (err, res) => {
            if(err) {
                reject(err)
            }
        }
        db.hmset(personExtKey, person, cb)
        db.set(personNameKey, `${person.country}:${person.ext}`, cb)
        db.zadd(personsKey, 0, person.fullName, (err, res) => {
            if(err) {
                reject(err)
            } else {
                if(res == 1) {
                    // Key did not exist before, add to country count
                    db.hincrby(countriesKey, person.country.toLowerCase(), 1, (err, res) => {
                        if(err) {
                            reject(err)
                            return
                        }
                    })
                }
                fulfill(res)
            }
        })
    })
}

exports.resetScrapeKey = (db) => {
    return new Promise((fulfill, reject) => {
        db.set('scrape', 'data is up-to-date', (err, res) => {
            if(err) {
                reject(err)
            }
        })
        db.expire('scrape', 3600, (err, res) => {
            if(err) {
                reject(err)
            } else {
                fulfill(res)
            }
        })
    })
}
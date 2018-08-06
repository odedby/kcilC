module.exports = (pub, sub, expireCb) => {
    return new Promise((fulfill, reject) => {
        pub.send_command('config', ['set', 'notify-keyspace-events', 'Ex'], (e, r) => {
            const expired_key = '__keyevent@0__:expired'
            if(e) {
                reject(e)
            } else {
                sub.subscribe(expired_key, () => {
                    console.log('Subscribed to "' + expired_key + '" event channel: ' + r)
                    sub.on('message', (chn, msg) => {
                        if(msg == 'scrape') {
                            expireCb(pub)
                        }
                    })
                })
            }
        })
    })
}
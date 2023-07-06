const fs = require('fs')
const path = require('path')
const fileConfig = path.join(__dirname, "config.json")
const fileLastRead = path.join(__dirname, "lastread.json")
var config = {}
var lastread = {updated: "2023-07-04T13:13:13-05:00", features: []}    

// * Format Date Time
function formatDate(d, h) {
    let dateOptions = { hour12: h, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    let s = (new Date(d)).toLocaleString("en-US", dateOptions)
    return s.replace(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2})/, '$1/$2/$3 $4:$5')
}

// * Lookup nws location in config under regions
function nwsWeb(loc) {
    let nws = config.Wx.regions.filter(item => item.nwsName === loc)
    if (nws.length < 1) {
        nws = [{
            "nwsName": loc,
            "nwsUrl": "https://www.weather.gov/",
            "note": "Default"
        }]
    }
    return nws
}

// * Configure string for message type
function nwsMsgType(messageType, event) {
    let msg = ' '
    switch (messageType) {
        case 'Alert':
            msg = ' issued '
            if (event.substr(0, 1) == "A" || event.substr(0, 1) == "E" || event.substr(0, 1) == "I" || event.substr(0, 1) == "O" || event.substr(0, 1) == "U") {
                msg += 'an '
            } else {
                msg += 'a '
            }
            break
        case 'Update':
            msg = ' updated the '
            break
        case 'Cancel':
            msg = ' canceled the '
            break
    }
    return msg
}

// * Post to Mastodon 
function postMastodon(post) {
    let p = new Promise((resolve, reject) => {
        fetch(config.Mastodon.url + config.Mastodon.apiPost, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 'access_token': config.Mastodon.token, 'status': post })
        })
            .then(resp => resp.json())
            .then(json => { resolve(json) })
            .catch(err => { resolve(err) })
    })
    return p
}

// * Check if alert was sent before 
function sentBefore(id) {
    let r = false
    let a = lastread.features
    if (a.length > 0) {
        let b = a.filter(item => item.properties.id === id)
        if (b.length > 0) {
            r = true
        }
    }
    return r
}


// * Process Wx Alerts
function processWxAlerts(data) {
    let p = new Promise((resolve, reject) => {
        if (data.title == 'Not Found') {
            reject(new Error('NWS API Alert File Not Found (Check settings in config.json)'))
        } else {
            console.log('\x1b[92m' + formatDate(Date.now(), false) + '\x1b[0m')
            console.log('\x1b[93m' + data.title + '\x1b[0m')
            console.log('\x1b[33mUpdated: ' + formatDate(data.updated, false) + '\x1b[0m')
            if (data.updated === lastread.updated) {
                console.log('\x1b[94mNo New Update\x1b[0m')
                resolve(data)
            } else {
                let alerts = data.features
                let alertsLen = alerts.length
                if (alertsLen < 1) {
                    console.log('\x1b[94mNo Alerts\x1b[0m')
                    resolve(data)
                } else {
                    alerts.forEach(async (item, index) => {
                        console.log('* ' + formatDate(item.properties.sent, false) + ' ' + item.properties.senderName + ': ' + item.properties.event)
                        if (!sentBefore(item.properties.id)) {
                            t = config.Mastodon.postLead
                            nwsRegion = nwsWeb(item.properties.senderName)
                            t += nwsRegion[0].shortName + nwsMsgType(item.properties.messageType, item.properties.event)
                            t += item.properties.event
                            if (item.properties.messageType == 'alert') {
                                t += ' until ' + formatDate(item.properties.expires, true)
                            }
                            t += ' for ' + item.properties.areaDesc
                            if (item.properties.parameters.NWSheadline) {
                                t += ' [' + item.properties.parameters.NWSheadline + '] '
                            }
                            if (t.length > config.Mastodon.postSize) {
                                t2 = t.substring(config.Mastodon.postSize - 36)
                                t2 = '(cont.) ' + t2
                                t2 += ' ' + nwsRegion[0].nwsUrl
                                t = t.substring(0, config.Mastodon.postSize - 36) + ' (cont.)'
                            } else {
                                t2 = ''
                                t += ' ' + nwsRegion[0].nwsUrl
                            }

                            if (config.Mastodon.posting === 'on') {
                                let jd = {}
                                if (t2 !== '') {
                                    postMastodon(t)
                                        .then(async (d) => {
                                            console.log('\x1b[90m' + t + '\x1b[0m')
                                            postMastodon(t2)
                                                .then(d => {
                                                    console.log('\x1b[90m' + t2 + '\x1b[0m')
                                                })
                                                .catch(err => {
                                                    console.log(err)
                                                })
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                } else {
                                    postMastodon(t)
                                        .then(d => {
                                            console.log('\x1b[90m' + t + '\x1b[0m')
                                        })
                                        .catch(err => {
                                            console.log(err)
                                        })
                                }
                            }
                        } else {
                            console.log("(sent before)")
                        }
                        if (index === alertsLen - 1) {
                            resolve(data)
                        }
                    })
                }
            }
        }
    })
    return p
}

// * Get NWS API ALerts
function getWxAlerts() {
    let p = new Promise((resolve, reject) => {
        let url = config.Wx.apiAlertsArea + config.Wx.state
        if (config.Wx.apiUse == 'zone') {
            url = config.Wx.apiAlertsZone + config.Wx.zone
        }
        fetch(url)
            .then(res => res.json())
            .then(data => {
                processWxAlerts(data)
                    .then(data => {
                        lastread = data
                        let jdata = JSON.stringify(data)
                        fs.writeFileSync(fileLastRead, jdata)
                        resolve('OK')
                    })
                    .catch(err => {
                        console.log('\x1b[91m' + err + '\x1b[0m')
                        reject(err)
                    })
            })
            .catch(err => {
                console.log('\x1b[91m' + err + '\x1b[0m')
                reject(err)
            })
    })
    return p
}

// * Runs the alerts functions (setTimeout)
function doAlerts() {
    getWxAlerts()
        .then(
            data => {
                console.log('...')
                setTimeout(doAlerts, 120 * 1000)
            }
        )
        .catch(
            err => {
                return false
            }
        )
}

// * launcher function - Check for subfiles
function main() {
    let readData = ""   
    console.log('\n\x1b[92m** NWS ALERTS TO MASTODON **\x1b[0m')
    if (fs.existsSync(fileConfig)) {
        try {
            readData = fs.readFileSync(fileConfig)
            config = JSON.parse(readData)
            let t = `NWS Alerts for ${config.Wx.apiUse} ${(config.Wx.apiUse === 'area' ? config.Wx.state : config.Wx.zone)}. Mastodon posting is ${config.Mastodon.posting}`
            console.log(t)
        } catch (err) {
            console.log('\x1b[91mBad Read: config.json\x1b[0m')
            console.log(err)
            return false
        }
        if (fs.existsSync(fileLastRead)) {
            try {
                readData = fs.readFileSync(fileLastRead)
                lastread = JSON.parse(readData)
            } catch (err) {
                console.log('\x1b[91mBad Read: lastread.json (Suggest deleting file)\x1b[0m')
                console.log(err)
                return false
            }
        }
        
        // ! doAlerts will continue running with setTimeout
        doAlerts()

    } else {
        console.log('\x1b[91mFile Missing: config.json\x1b[0m')
        return false
    }
}

main()

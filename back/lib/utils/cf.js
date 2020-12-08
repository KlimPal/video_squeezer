import _ from 'lodash'
import crypto from 'crypto'
import livr from 'livr'
import flatten from 'flat'
import pino from 'pino'
import livrExtraRules from 'livr-extra-rules'

livr.Validator.defaultAutoTrim(true)
livr.Validator.registerDefaultRules(livrExtraRules)

function generateRandomCode(length, charPreset = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') {
    let charList = []
    for (let i = 0; i < length; i++) {
        charList[i] = charPreset[Math.round(Math.random() * (charPreset.length - 1))]
    }
    return charList.join('')
}

let counterForUniqueCode = 0
let lastDateForUniqueCode = 0

function generateUniqueCode(minLength = 0, splitChar = '_') {
    let dateNow = Date.now()
    let result = dateNow.toString(36)
    if (lastDateForUniqueCode == dateNow) {
        counterForUniqueCode++
        result += splitChar + counterForUniqueCode.toString(36)
    } else {
        counterForUniqueCode = 0
    }
    lastDateForUniqueCode = dateNow
    let lengthOfRandomSuffix = minLength - result.length
    if (lengthOfRandomSuffix > 0) {
        result += splitChar + generateRandomCode(lengthOfRandomSuffix - 1)
    }
    return result
}

function sleep(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, timeout)
    })
}

function deepMap(data, callback) {
    let result = _.cloneDeep(data)

    function func(obj) {
        for (let prop in obj) {
            let value = obj[prop]
            let type = typeof value
            if (obj.hasOwnProperty(prop)) {
                if (type == 'object') {
                    func(obj[prop])
                } else {
                    obj[prop] = callback(obj[prop])
                }
            }
        }
    }
    func(result)
    return result
}

function project(obj, projection) {
    let projectedObj = {}
    if (Array.isArray(projection)) {
        let obj = {}
        for (let key of projection) {
            obj[key] = true
        }
        projection = obj
    }
    for (let key in projection) {
        projectedObj[key] = obj[key]
    }
    return projectedObj
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function localeCompareSort(stringList) {
    return stringList.sort((a, b) => a.localeCompare(b))
}

function sha256Hex(string) {
    return crypto.createHash('sha256')
        .update(string)
        .digest('hex')
}

function sha1Hex(string) {
    return crypto.createHash('sha1')
        .update(string)
        .digest('hex')
}


function sortObjectKeys(obj) {
    return Object.keys(obj).sort().reduce((result, key) => {
        result[key] = obj[key]
        return result
    }, {})
}

function flattenObject(obj, { delimiter = '_', safe = true } = {}) {
    let params = { delimiter, safe }
    return flatten(obj, params)
}

function unflattenObject(obj, { delimiter = '_', safe = true } = {}) {
    let params = { delimiter, safe }
    return flatten.unflatten(obj, params)
}

function fillTemplate(str, map) {
    for (let key in map) {
        str = str.replace(`{{${key}}}`, map[key])
    }
    return str
}

const logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
}, pino.destination({
    dest: `logs/${new Date().toISOString().split('T')[0]}.log`,
    sync: false,
}))

function pipeToFinish(...streams) {
    return new Promise((resolve, reject) => {
        try {
            let lastStream = null
            for (let i = 0; i < streams.length; i++) {
                streams[i].on('error', (e) => {
                    reject(e)
                })
                if (lastStream) {
                    lastStream.pipe(streams[i])
                }
                lastStream = streams[i]
            }
            lastStream.on('finish', () => {
                resolve()
            })
        } catch (err) {
            reject(err)
        }
    })
}

export default {
    generateRandomCode,
    generateUniqueCode,
    sleep,
    deepMap,
    project,
    escapeRegExp,
    localeCompareSort,
    sha256Hex,
    sha1Hex,
    sortObjectKeys,
    livr,
    flattenObject,
    unflattenObject,
    fillTemplate,
    logger,
    pipeToFinish,
}

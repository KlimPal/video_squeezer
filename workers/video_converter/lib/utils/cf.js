import livr from 'livr'
import livrExtraRules from 'livr-extra-rules'

livr.Validator.defaultAutoTrim(true)
livr.Validator.registerDefaultRules(livrExtraRules)

function generateRandomCode(length, charPreset = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM') {
    const charList = []
    for (let i = 0; i < length; i++) {
        charList[i] = charPreset[Math.round(Math.random() * (charPreset.length - 1))]
    }
    return charList.join('')
}

let counterForUniqueCode = 0
let lastDateForUniqueCode = 0

function generateUniqueCode(minLength = 0, splitChar = '_') {
    const dateNow = Date.now()
    let result = dateNow.toString(36)
    if (lastDateForUniqueCode === dateNow) {
        counterForUniqueCode++
        result += splitChar + counterForUniqueCode.toString(36)
    } else {
        counterForUniqueCode = 0
    }
    lastDateForUniqueCode = dateNow
    const lengthOfRandomSuffix = minLength - result.length
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


function sum(array) {
    return array.reduce((a, b) => a + b, 0)
}

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

function livrValidate(rules, data) {
    const validator = new livr.Validator(rules)
    const validData = validator.validate(data)

    if (!validData) {
        throw new Error(JSON.stringify(validator.getErrors(), null, 4))
    } else {
        return validData
    }
}

function getFriendlyFileSize(sizeInBytes) {
    const postfixText = ['B', 'KB', 'MB', 'GB']
    let i = 0
    while (sizeInBytes >= 1024) {
        sizeInBytes /= 1024
        i++
    }
    return `${sizeInBytes.toFixed(i)} ${postfixText[i]}`
}


export default {
    sleep,
    pipeToFinish,
    sum,
    generateUniqueCode,
    livr,
    livrValidate,
    getFriendlyFileSize,
}

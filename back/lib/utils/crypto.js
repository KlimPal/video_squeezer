import crypto from 'crypto'
import cf from './cf.js'


function getPasswordHash(password, {
    costExponent = 10,
    keylen = 32,
    salt = Buffer.from(cf.generateUniqueCode()).toString('hex'),
} = {}) {
    const cost = 2 ** costExponent
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, keylen, { cost }, (err, derivedKey) => {
            if (err) {
                return reject(err)
            }
            let result = `${costExponent}$${salt}$${derivedKey.toString('hex')}`
            resolve(result)
        })
    })
}

async function isPasswordValid(hash, password) {
    let [costExponent, salt, hashBody] = hash.split('$')
    costExponent = Number(costExponent)
    const keylen = hashBody.length / 2
    const computedHash = await getPasswordHash(password, { keylen, costExponent, salt })
    return hash === computedHash
}

function sha256hex(text) {
    return crypto.createHash('sha256').update(text).digest('hex')
}


export {
    getPasswordHash,
    isPasswordValid,
    sha256hex,
}

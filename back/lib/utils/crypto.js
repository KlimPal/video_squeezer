import crypto from 'crypto'
import fs from 'fs-extra'
import cf from './cf.js'

function createAesDecipheriv(password, iv = Buffer.alloc(16, 0)) {
    const key = crypto.createHash('sha256').update(password).digest()
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return decipher
}
function createAesCipheriv(password, iv = Buffer.alloc(16, 0)) {
    const key = crypto.createHash('sha256').update(password).digest()
    const decipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    return decipher
}


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
            const result = `${costExponent}$${salt}$${derivedKey.toString('hex')}`
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


function aes256Encrypt(data, key, { outputEncoding = 'base64', iv } = {}) {
    if (typeof (data) === 'boolean') {
        return data
    }
    if (!data.length) {
        if (outputEncoding) {
            return ''
        }
        return Buffer.from('')
    }
    if (!iv) {
        iv = Buffer.alloc(16, 0)
    }
    if (iv && typeof (iv) === 'string') {
        iv = crypto.createHash('sha1').update(iv).digest().slice(0, 16)
    }
    key = crypto.createHash('sha256').update(key).digest()
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
    if (outputEncoding) {
        return encrypted.toString(outputEncoding)
    }
    return encrypted
}

function aes256Decrypt(data, key, { inputEncoding = 'base64', outputEncoding = 'utf8', iv } = {}) {
    if (typeof (data) === 'boolean') {
        return data
    }
    if (!data.length) {
        if (outputEncoding) {
            return ''
        }
        return Buffer.from('')
    }
    if (typeof (data) === 'string') {
        data = Buffer.from(data, inputEncoding)
    }
    if (!iv) {
        iv = Buffer.alloc(16, 0)
    }
    if (iv && typeof (iv) === 'string') {
        iv = crypto.createHash('sha1').update(iv).digest().slice(0, 16)
    }
    key = crypto.createHash('sha256').update(key).digest()
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    if (outputEncoding) {
        return decrypted.toString(outputEncoding)
    }
    return decrypted
}


export {
    getPasswordHash,
    isPasswordValid,
    sha256hex,
    aes256Encrypt,
    aes256Decrypt,
}

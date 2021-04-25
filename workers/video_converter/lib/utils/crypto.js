import crypto from 'crypto'

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
    aes256Encrypt,
    aes256Decrypt,
}

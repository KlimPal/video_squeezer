import { BaseModel } from './base.js'
import config from '../../config.js'
import { aes256Encrypt, aes256Decrypt } from '../utils/crypto.js'

class MinioServer extends BaseModel {
    id
    host
    port
    status
    accessKey
    encryptedSecretKey
    createdAt
    updatedAt

    static get tableName() {
        return 'minio_servers'
    }
    get secretKey() {
        const cryptoKey = config.keyForEncryptingMinioServerKey
        const secretKey = aes256Decrypt(this.encryptedSecretKey, cryptoKey)
        return secretKey
    }

    static async createServer({
        host,
        port,
        accessKey,
        secretKey,
    }) {
        const cryptoKey = config.keyForEncryptingMinioServerKey
        if (!cryptoKey) {
            throw new Error('config.keyForEncryptingMinioServerKey not specified')
        }
        const encryptedSecretKey = aes256Encrypt(secretKey, cryptoKey)
        const minioServer = await MinioServer.query().insert({
            host,
            port,
            accessKey,
            encryptedSecretKey,
        })

        return minioServer
    }
}

// async function test() {
//     await MinioServer.createServer({
//         host: 'minio.video-squeezer.klimpal.com',
//         port: 443,
//         accessKey: 'someaccesskey',
//         secretKey: 'ddd',
//     })
// }
// test()

export default MinioServer

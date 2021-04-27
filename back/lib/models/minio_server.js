import minio from 'minio'
import path from 'path'
import { BaseModel } from './base.js'
import File from './file/_index.js'
import config from '../../config.js'
import { aes256Encrypt, aes256Decrypt } from '../utils/crypto.js'
import cf from '../utils/cf.js'

const { defaultBucket } = File


class MinioServer extends BaseModel {
    id
    host
    port
    status
    accessKey
    encryptedSecretKey
    createdAt
    updatedAt

    dump() {
        return {
            id: this.id,
            host: this.host,
            port: this.port,
            status: this.status,
            createdAt: this.createdAt,
        }
    }

    static get tableName() {
        return 'minio_servers'
    }

    async prepareInstance() {
        const defaultRegion = 'us-east-1'
        const bucketListToEnsure = [File.defaultBucket]
        const minioClient = this.getMinioClient()
        const created = (await minioClient.listBuckets()).map((el) => el.name)
        const bucketsToCreate = bucketListToEnsure.filter((el) => !created.includes(el))
        await Promise.all(bucketsToCreate.map((name) => minioClient.makeBucket(name, defaultRegion)))


        const testFileObjectName = 'public/test_1MB'

        const { res, err } = await cf.safeFuncRun(() => minioClient.statObject(defaultBucket, testFileObjectName))
        if (err?.code === 'NotFound') {
            await minioClient.fPutObject(defaultBucket, testFileObjectName, path.join(config.indexPath, 'constants', 'random_1MB'))
        }
        const existingTestFile = await File.query().findOne({
            objectName: testFileObjectName,
            minioServerId: this.id,
        })
        if (!existingTestFile) {
            await File.query().insert({
                objectName: testFileObjectName,
                minioServerId: this.id,
                bucket: defaultBucket,
                size: (await minioClient.statObject(defaultBucket, testFileObjectName)).size,
                status: File.STATUSES.UPLOAD_COMPLETED,
            })
        }
    }

    get secretKey() {
        const cryptoKey = config.keyForEncryptingMinioServerKey
        const secretKey = aes256Decrypt(this.encryptedSecretKey, cryptoKey)
        return secretKey
    }

    getMinioClient() {
        return new minio.Client({
            endPoint: this.host,
            port: this.port,
            useSSL: true,
            accessKey: this.accessKey,
            secretKey: this.secretKey,
        })
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
        await minioServer.prepareInstance()

        return minioServer
    }
    static async prepareMinioServers() {
        const minioServers = await MinioServer.query()
        await Promise.all(minioServers.map((el) => el.prepareInstance()))
    }
}


export default MinioServer


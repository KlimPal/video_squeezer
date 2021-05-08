import minio from 'minio'
import path from 'path'
import { BaseModel } from './base.js'
import File from './file/_index.js'
import config from '../../config.js'
import { aes256Encrypt, aes256Decrypt } from '../utils/crypto.js'
import cf from '../utils/cf.js'


class MinioServer extends BaseModel {
    id
    host
    port
    status
    bucket
    region
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

    static STATUSES = {
        ACTIVE: 'ACTIVE',
        UNREACHABLE: 'UNREACHABLE',
    }
    static get tableName() {
        return 'minio_servers'
    }

    async prepareInstance() {
        let minioClient

        try {
            minioClient = this.getMinioClient()
            const createdBuckets = (await minioClient.listBuckets()).map((el) => el.name)
            if (!createdBuckets.includes(this.bucket)) {
                await minioClient.makeBucket(this.bucket, this.region)
            }
        } catch (err) {
            await this.$query().updateAndFetch({
                status: MinioServer.STATUSES.UNREACHABLE,
            })
            cf.logger.warn({
                minioServer: this,
                type: cf.logTypes.INTERNAL,
            }, 'Minio server unreachable')
            return
        }

        const testFileObjectName = 'public/test_1MB'

        const { res, err } = await cf.safeFuncRun(() => minioClient.statObject(this.bucket, testFileObjectName))
        if (err?.code === 'NotFound') {
            await minioClient.fPutObject(this.bucket, testFileObjectName, path.join(config.indexPath, 'constants', 'random_1MB'))
        }
        const existingTestFile = await File.query().findOne({
            objectName: testFileObjectName,
            minioServerId: this.id,
        })
        if (!existingTestFile) {
            await File.query().insert({
                objectName: testFileObjectName,
                minioServerId: this.id,
                bucket: this.bucket,
                size: (await minioClient.statObject(this.bucket, testFileObjectName)).size,
                status: File.STATUSES.UPLOAD_COMPLETED,
            })
        }
        if (this.status !== MinioServer.STATUSES.ACTIVE) {
            await this.$query().updateAndFetch({
                status: MinioServer.STATUSES.ACTIVE,
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
            region: this.region,
        })
    }

    static async createServer({
        host,
        port,
        accessKey,
        secretKey,
        region,
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
            region,
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


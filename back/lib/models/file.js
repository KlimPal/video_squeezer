import objection from 'objection'
import { User, FilePart } from './_index.js'
import { minioClient, defaultBucket } from '../services/fileApi.js'
import { BaseModel } from './base.js'
import cf from '../utils/cf.js'
import config from '../../config.js'

class File extends BaseModel {
    id
    bucket
    objectName
    metaData
    authorId
    createdAt
    updatedAt
    status

    static STATUSES = {
        PARTIAL_UPLOAD_STARTED: 'PARTIAL_UPLOAD_STARTED',
        UPLOAD_COMPLETED: 'UPLOAD_COMPLETED'
    }

    async $afterDelete(queryContext) {
        await super.$afterDelete(queryContext)
        await minioClient.removeObject(this.bucket, this.objectName)
    }

    static get tableName() {
        return 'files'
    }

    static get relationMappings() {
        return {
            author: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'files.authorId',
                    to: 'users.id',
                },
            },
            fileParts: {
                relation: objection.Model.HasManyRelation,
                modelClass: FilePart,
                join: {
                    from: 'files.id',
                    to: 'fileParts.fileId',
                },
            },
        }
    }

    static async create(stringOrBufferOrStream, { metaData = null, authorId = null } = {}) {
        let objectName = cf.generateUniqueCode(24)
        await minioClient.putObject(defaultBucket, objectName, stringOrBufferOrStream, metaData)
        let stat = await minioClient.statObject(defaultBucket, objectName)
        return File.query().insert({
            objectName,
            bucket: defaultBucket,
            metaData,
            authorId,
            size: stat.size,
        })
    }
    getStream() {
        return minioClient.getObject(this.bucket, this.objectName)
    }
    get publicUrl() {
        return `${config.s3.publicBaseUrl}/${this.bucket}/${this.objectName}`
    }
    get publicUrlTemplate() {
        return `{{S3_PUBLIC_BASE_URL}}/${this.bucket}/${this.objectName}`
    }

    async getPresignedPutUrl(expiryInMs = 1000 * 60) {
        let url = await minioClient.presignedPutObject(this.bucket, this.objectName, expiryInMs / 1000)
        url = url.replace(/[^/]*\/\/[^/]*\//, `${config.s3.publicBaseUrl}/`)
        return url
    }

}

export default File

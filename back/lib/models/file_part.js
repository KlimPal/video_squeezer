import objection from 'objection'
import { User, File, MinioServer } from './_index.js'
import { BaseModel } from './base.js'
import cf from '../utils/cf.js'
import config from '../../config.js'


class FilePart extends BaseModel {
    id
    bucket
    objectName
    fileId
    rangeStart
    rangeEnd
    createdAt
    updatedAt
    status
    minioServerId

    static STATUSES = {
        CREATED: 'CREATED',
        UPLOADED: 'UPLOADED',
    }

    getMinioClient() {
        return File.getMinioClientById(this.minioServerId)
    }
    async $afterDelete(queryContext) {
        await super.$afterDelete(queryContext)
        const minioClient = await this.getMinioClient()
        await minioClient.removeObject(this.bucket, this.objectName)
    }

    static get tableName() {
        return 'fileParts'
    }

    static get relationMappings() {
        return {
            file: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: File,
                join: {
                    from: 'fileParts.fileId',
                    to: 'files.id',
                },
            },
            minioServer: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: MinioServer,
                join: {
                    from: 'fileParts.minioServerId',
                    to: 'minioServers.id',
                },
            },

        }
    }

    async getStream() {
        const minioClient = await this.getMinioClient()
        return minioClient.getObject(this.bucket, this.objectName)
    }

    async getPresignedPutUrl(expiryInMs = 1000 * 60) {
        const minioClient = await this.getMinioClient()
        const url = await minioClient.presignedPutObject(this.bucket, this.objectName, expiryInMs / 1000)

        return url
    }
}

export default FilePart

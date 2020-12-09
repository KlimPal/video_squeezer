import objection from 'objection'
import { User, File } from './_index.js'
import { minioClient, defaultBucket } from '../services/fileApi.js'
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

    static STATUSES = {
        CREATED: 'CREATED',
        UPLOADED: 'UPLOADED',
    }

    async $afterDelete(queryContext) {
        await super.$afterDelete(queryContext)
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
                    to: 'file.id',
                },
            },

        }
    }

    // getStream() {
    //     return minioClient.getObject(this.bucket, this.objectName)
    // }
    // get publicUrl() {
    //     return `${config.s3.publicBaseUrl}/${this.bucket}/${this.objectName}`
    // }
    // get publicUrlTemplate() {
    //     return `{{S3_PUBLIC_BASE_URL}}/${this.bucket}/${this.objectName}`
    // }

    async getPresignedPutUrl(expiryInMs = 1000 * 60) {
        let url = await minioClient.presignedPutObject(this.bucket, this.objectName, expiryInMs / 1000)
        url = url.replace(/[^/]*\/\/[^/]*\//, `${config.s3.publicBaseUrl}/`)
        return url
    }

}

export default FilePart

import objection from 'objection'
import path from 'path'
import fs from 'fs-extra'
import { User, FilePart } from './_index.js'
import { minioClient, defaultBucket } from '../services/fileApi.js'
import { BaseModel } from './base.js'
import cf from '../utils/cf.js'
import { concatFiles } from '../utils/files.js'
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
        PART_CONCATINATING: 'PART_CONCATINATING',
        UPLOAD_COMPLETED: 'UPLOAD_COMPLETED',
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

    async isAllPartsUploaded() {
        let oneNotUploaded = await FilePart.query().findOne({
            fileId: this.id,
            status: FilePart.STATUSES.CREATED,
        })
        if (oneNotUploaded) {
            return false
        }
        return true
    }

    async completePartialUpload() {
        if (this.status === File.STATUSES.UPLOAD_COMPLETED) {
            return this
        }

        let allParts = (await FilePart.query().where({
            fileId: this.id,
        })).sort((a, b) => a.rangeStart - b.rangeStart)

        let tmpDir = path.join(config.indexPath, 'tmp')
        let targetPath = path.join(tmpDir, this.id)
        let sourceList = []
        await Promise.all(allParts.map(async (part) => {
            let partLocalPath = path.join(tmpDir, part.id)
            sourceList.push(partLocalPath)
            await cf.pipeToFinish(await part.getStream(), fs.createWriteStream(partLocalPath))
        }))
        await concatFiles(sourceList, targetPath)
        await minioClient.fPutObject(this.bucket, this.objectName, targetPath)
        let stat = await minioClient.statObject(this.bucket, this.objectName)
        await Promise.all([...sourceList, targetPath].map((el) => fs.remove(el)))
        await this.$query().patchAndFetch({
            status: File.STATUSES.UPLOAD_COMPLETED,
            size: stat.size,
        })
        await Promise.all(allParts.map((part) => part.$query().delete()))

        return this
    }
}

export default File

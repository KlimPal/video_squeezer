import objection from 'objection'
import path from 'path'
import fs from 'fs-extra'
import minio from 'minio'
import { file } from 'googleapis/build/src/apis/file'
import { User, FilePart, MinioServer } from '../_index.js'
import { BaseModel } from '../base.js'
import cf from '../../utils/cf.js'
import { concatFiles } from '../../utils/files.js'
import config from '../../../config.js'
import { concatObjects, getS3Client } from './utils.js'


class File extends BaseModel {
    id
    bucket
    objectName
    metaData
    authorId
    createdAt
    updatedAt
    status
    originalFileName
    minioServerId

    static STATUSES = {
        PARTIAL_UPLOAD_STARTED: 'PARTIAL_UPLOAD_STARTED',
        PART_CONCATINATING: 'PART_CONCATINATING',
        UPLOAD_COMPLETED: 'UPLOAD_COMPLETED',
        NOT_UPLOADED: 'NOT_UPLOADED',
    }

    async $afterDelete(queryContext) {
        await super.$afterDelete(queryContext)
        const minioClient = await this.getMinioClient()
        await minioClient.removeObject(this.bucket, this.objectName)
    }

    static get tableName() {
        return 'files'
    }


    static async getMinioClientById(minioServerId) {
        const minioServer = await MinioServer.query().findById(minioServerId)

        return minioServer.getMinioClient()
    }

    getMinioClient() {
        return File.getMinioClientById(this.minioServerId)
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
            minioServer: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: MinioServer,
                join: {
                    from: 'files.minioServerId',
                    to: 'minioServers.id',
                },
            },

        }
    }

    static async create(stringOrBufferOrStream, {
        minioServerId, metaData = null, authorId = null, originalFileName,
    } = {}) {
        const objectName = cf.generateUniqueCode(24)
        const minioServer = await MinioServer.query().findById(minioServerId)
        const minioClient = await File.getMinioClientById(minioServerId)

        await minioClient.putObject(minioServer.bucket, objectName, stringOrBufferOrStream, metaData)
        const stat = await minioClient.statObject(minioServer.bucket, objectName)
        return File.query().insert({
            objectName,
            bucket: minioServer.bucket,
            metaData,
            authorId,
            size: stat.size,
            originalFileName,
            minioServerId,
        })
    }
    async getStream() {
        const minioClient = await this.getMinioClient()
        return minioClient.getObject(this.bucket, this.objectName)
    }


    get extension() {
        return path.extname(this.originalFileName)
    }

    async getPresignedPutUrl(expiryInMs = 1000 * 60) {
        const minioClient = await this.getMinioClient()
        const url = await minioClient.presignedPutObject(this.bucket, this.objectName, expiryInMs / 1000)
        return url
    }
    async getPresignedGetUrl(expiryInMs = 1000 * 60, { responseContentDisposition } = {}) {
        if (!responseContentDisposition) {
            responseContentDisposition = `attachment; filename="${this.originalFileName}"`
        }
        const minioClient = await this.getMinioClient()
        const url = await minioClient.presignedGetObject(this.bucket, this.objectName, expiryInMs / 1000, {
            'response-content-disposition': responseContentDisposition,
        })
        return url
    }

    async isAllPartsUploaded() {
        const oneNotUploaded = await FilePart.query().findOne({
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

        const allParts = (await FilePart.query().where({
            fileId: this.id,
        })).sort((a, b) => a.rangeStart - b.rangeStart)

        const minioServer = await MinioServer.query().findById(this.minioServerId)

        const s3Client = getS3Client({
            host: minioServer.host,
            port: minioServer.port,
            accessKey: minioServer.accessKey,
            secretKey: minioServer.secretKey,
            region: minioServer.region,
        })

        await concatObjects({
            sourceObjects: allParts.map((el) => ({ bucket: el.bucket, objectName: el.objectName })),
            targetBucket: this.bucket,
            targetObjectName: this.objectName,
            s3Client,
        })

        const minioClient = await this.getMinioClient()
        const stat = await minioClient.statObject(this.bucket, this.objectName)
        await this.$query().patchAndFetch({
            status: File.STATUSES.UPLOAD_COMPLETED,
            size: stat.size,
        })


        await Promise.all(allParts.map((part) => part.$query().delete()))

        return this
    }
}


export default File


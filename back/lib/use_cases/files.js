import cf from '../utils/cf.js'
import { File, FilePart, MinioServer } from '../models/_index.js'
import {
    emitError, errorCodes,
} from '../utils/error_utils.js'

async function getFileServers() {
    const servers = await MinioServer.query()

    return servers
}

async function getPresignedPutObjectUrl(data, { context }) {
    const expiryInMs = 1000 * 60 * 10
    const fileId = cf.generateUniqueCode()
    const objectName = cf.generateUniqueCode(24)

    const file = await File.query().insert({
        id: fileId,
        bucket: File.defaultBucket,
        objectName,
        authorId: context.userId,
    })


    const url = await file.getPresignedPutUrl(expiryInMs)

    return {
        url,
        fileId,
    }
}


getOwnFiles.rules = {
}

async function getOwnFiles(data, { context }) {
    const files = await File.query().where({
        authorId: context.userId,
    })
    return files
}


completePartialUpload.rules = {
    fileId: ['required', 'string'],
}

async function completePartialUpload(data, { context }) {
    const file = await File.query().findById(data.fileId)
    if (file.authorId !== context.userId) {
        emitError(errorCodes.notPermitted)
    }
    if (await file.isAllPartsUploaded()) {
        return file.completePartialUpload()
    }
    return this
}

completeFilePart.rules = {
    filePartId: ['required', 'string'],
}


async function completeFilePart(data, { context }) {
    const filePart = await FilePart.query().findById(data.filePartId)
    if (!filePart) {
        emitError(errorCodes.notFound)
    }

    const file = await File.query().findById(filePart.fileId)

    if (file.authorId !== context.userId) {
        emitError(errorCodes.notPermitted)
    }

    await filePart.$query().patch({
        status: FilePart.STATUSES.UPLOADED,
    })

    return 'ok'
}

getPartialUpload.rules = {
    fileSize: ['required', 'positive_integer'],
    fileHash: ['required', 'string'],
    fileName: ['required', 'string', { max_length: 255 }],
    minioServerId: ['string'],
}


async function getPartialUpload(data, { context }) {
    let partSize = 20 * 1024 * 1024

    if (data.fileSize / partSize > 100) {
        partSize = Math.round(data.fileSize / 100)
    }

    const presignedLinkExpiryInMs = 1000 * 60 * 60 * 24 // 1 day

    const existingFile = await File.query().findOne({
        authorId: context.userId,
        hash: data.fileHash,
    }).withGraphFetched('fileParts')

    if (existingFile) {
        if (existingFile.status === File.STATUSES.UPLOAD_COMPLETED) {
            emitError(errorCodes.alreadyExists, existingFile)
        }
        const uploadParts = await Promise.all(existingFile.fileParts.map(async (filePart) => ({
            rangeStart: filePart.rangeStart,
            rangeEnd: filePart.rangeEnd,
            status: filePart.status,
            filePartId: filePart.id,
            presignedPutUrl: await filePart.getPresignedPutUrl(presignedLinkExpiryInMs),
        })))

        return {
            uploadParts,
            fileId: existingFile.id,
        }
    }

    let { minioServerId } = data
    console.log(minioServerId)

    if (minioServerId) {
        const minioServer = await MinioServer.query().findById(minioServerId)
        if (!minioServer) {
            emitError(errorCodes.notFound, { field: 'minioServerId' })
        }
    } else {
        console.log('zaaz')

        const minioServer = await MinioServer.query().findOne({ id: 'knxc1cky' })
        minioServerId = minioServer.id
        console.log(minioServerId)
    }

    const file = await File.query().insert({
        id: cf.generateUniqueCode(),
        bucket: File.defaultBucket,
        objectName: cf.generateUniqueCode(24),
        authorId: context.userId,
        hash: data.fileHash,
        status: File.STATUSES.PARTIAL_UPLOAD_STARTED,
        size: data.fileSize,
        originalFileName: data.fileName,
        minioServerId,
    })

    const partsNumber = Math.ceil(data.fileSize / partSize)
    const filePartsData = Array(partsNumber).fill().map((_, partIndex) => ({
        id: cf.generateUniqueCode(),
        bucket: File.defaultBucket,
        fileId: file.id,
        rangeStart: partIndex * partSize,
        rangeEnd: (partIndex + 1) * partSize,
        objectName: `${file.objectName}_parts/${cf.generateUniqueCode(24)}`,
        status: FilePart.STATUSES.CREATED,
        minioServerId,
    }))
    const lastPart = filePartsData.slice(-1)[0]
    lastPart.rangeEnd = data.fileSize

    const fileParts = await FilePart.query().insert(filePartsData)

    const uploadParts = await Promise.all(fileParts.map(async (filePart) => ({
        rangeStart: filePart.rangeStart,
        rangeEnd: filePart.rangeEnd,
        filePartId: filePart.id,
        status: filePart.status,
        presignedPutUrl: await filePart.getPresignedPutUrl(presignedLinkExpiryInMs),
    })))

    return {
        uploadParts,
        fileId: file.id,
    }
}

export {
    getPresignedPutObjectUrl,
    getPartialUpload,
    completeFilePart,
    completePartialUpload,
    getOwnFiles,
    getFileServers,
}

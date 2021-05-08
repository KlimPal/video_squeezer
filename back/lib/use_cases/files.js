import cf from '../utils/cf.js'
import { File, FilePart, MinioServer } from '../models/_index.js'
import {
    emitError, errorCodes,
} from '../utils/error_utils.js'

async function getFileServers() {
    const servers = await MinioServer.query().where({
        status: MinioServer.STATUSES.ACTIVE,
    })
    await Promise.all(servers.map(async (server) => {
        const testFile = await File.query().findOne({
            minioServerId: server.id,
            objectName: 'public/test_1MB',
        })
        if (!testFile) {
            return
        }
        server.linkToTestDownloadSpeed = await testFile.getPresignedGetUrl(cf.getDurationInMs({ days: 7 }))
    }))
    const result = servers.map((el) => ({
        ...el.dump(),
        linkToTestDownloadSpeed: el.linkToTestDownloadSpeed,
    }))
    return result
}

async function getPresignedPutObjectUrl(data, { context }) {
    emitError(errorCodes.notPermitted)
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

    const presignedLinkExpiryInMs = cf.getDurationInMs({ days: 1 })

    const existingFile = await File.query().findOne({
        authorId: context.userId,
        hash: data.fileHash,
    }).withGraphFetched('fileParts')
    let { minioServerId } = data

    const createNewFileOnNewServer = minioServerId && existingFile && existingFile.minioServerId !== minioServerId

    if (existingFile && !createNewFileOnNewServer) {
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

    let minioServer
    if (minioServerId) {
        minioServer = await MinioServer.query().findById(minioServerId)
        if (!minioServer) {
            emitError(errorCodes.notFound, { field: 'minioServerId' })
        }
    } else {
        minioServer = await MinioServer.query().findOne({ status: MinioServer.STATUSES.ACTIVE })
        minioServerId = minioServer.id
    }

    const targetObjectName = `users/${context.userId}/${cf.generateUniqueCode()}`
    const file = await File.query().insert({
        id: cf.generateUniqueCode(),
        bucket: minioServer.bucket,
        objectName: targetObjectName,
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
        bucket: minioServer.bucket,
        fileId: file.id,
        rangeStart: partIndex * partSize,
        rangeEnd: (partIndex + 1) * partSize,
        objectName: `${file.objectName}_parts/${partIndex}`,
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

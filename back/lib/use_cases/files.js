import cf from '../utils/cf.js'
import config from '../../config.js'
import fileApi from '../services/fileApi.js'
import { File, FilePart } from '../models/_index.js'

async function getPresignedPutObjectUrl(data, { context }) {
    const expiryInMs = 1000 * 60 * 10
    const fileId = cf.generateUniqueCode()
    const objectName = cf.generateUniqueCode(24)

    let file = await File.query().insert({
        id: fileId,
        bucket: fileApi.defaultBucket,
        objectName,
        authorId: context.userId,
    })

    let url = await file.getPresignedPutUrl(expiryInMs)

    return {
        url,
        fileId,
    }
}

getPartialUpload.rules = {
    fileSize: ['required', 'positive_integer'],
    fileHash: ['required', 'string'],
}

async function getPartialUpload(data, { context }) {
    const partSize = 50 * 1024 * 1024
    const presignedLinkExpiryInMs = 1000 * 60 * 60 * 24 // 1 day

    let existingFile = await File.query().findOne({
        authorId: context.userId,
        hash: data.fileHash,
    }).withGraphFetched('fileParts')

    if (existingFile) {
        let uploadParts = await Promise.all(existingFile.fileParts.map(async (filePart) => ({
            rangeStart: filePart.rangeStart,
            rangeEnd: filePart.rangeEnd,
            status: filePart.status,
            presignedPutUrl: await filePart.getPresignedPutUrl(presignedLinkExpiryInMs),
        })))

        return {
            uploadParts,
            fileId: existingFile.id,
        }
    }

    let file = await File.query().insert({
        id: cf.generateUniqueCode(),
        bucket: fileApi.defaultBucket,
        objectName: cf.generateUniqueCode(24),
        authorId: context.userId,
        hash: data.fileHash,
        status: File.STATUSES.PARTIAL_UPLOAD_STARTED,
    })



    let partsNumber = Math.ceil(data.fileSize / partSize)
    let filePartsData = Array(partsNumber).fill().map((_, partIndex) => ({
        id: cf.generateUniqueCode(),
        bucket: fileApi.defaultBucket,
        fileId: file.id,
        rangeStart: partIndex * partSize,
        rangeEnd: (partIndex + 1) * partSize,
        objectName: cf.generateUniqueCode(24),
        status: FilePart.STATUSES.CREATED,
    }))
    let lastPart = filePartsData.slice(-1)[0]
    lastPart.rangeEnd = data.fileSize

    let fileParts = await FilePart.query().insert(filePartsData)

    let uploadParts = await Promise.all(fileParts.map(async (filePart) => ({
        rangeStart: filePart.rangeStart,
        rangeEnd: filePart.rangeEnd,
        status: filePart.status,
        presignedPutUrl: await filePart.getPresignedPutUrl(presignedLinkExpiryInMs),
    })))

    return {
        uploadParts,
        fileId: file.id,
    }
}

export { getPresignedPutObjectUrl, getPartialUpload }

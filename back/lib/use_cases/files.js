import cf from '../utils/cf.js'
import config from '../../config.js'
import fileApi from '../services/fileApi.js'
import { File } from '../models/_index.js'


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

export { getPresignedPutObjectUrl }

import sharp from 'sharp'
import path from 'path'
import cf from '../utils/cf.js'
import config from '../../config.js'
import {
    emitError,
    errorCodes,
} from '../utils/error_utils.js'
import {
    User,
    File,
    VideoConvertingJob,
} from '../models/_index.js'
import { sha256hex } from '../utils/crypto.js'

import {
    videoConvertingInput,
} from '../services/bull_queues.js'

compress.rules = {
    fileId: ['required', 'string'],
    compressOptions: {
        nested_object: {
            size: ['required', 'integer', { number_between: [240, 2160] }],
            crf: ['required', 'integer', { number_between: [0, 51] }],
        },
    },
}
async function compress(validData, { context }) {
    const { userId } = context
    const file = await File.query().findById(validData.fileId)

    !file && emitError(errorCodes.notFound)

    const jobId = cf.generateUniqueCode() // sha256hex(JSON.stringify(validData))

    const targetKey = cf.generateUniqueCode(24)

    const targetFile = await File.query().insert({
        bucket: file.bucket,
        objectName: targetKey,
        authorId: userId,
        status: File.STATUSES.NOT_UPLOADED,
    })

    const convertingOptions = {
        height: validData.compressOptions.size,
        crf: validData.compressOptions.crf,
    }
    await videoConvertingInput.add({
        sourceBucket: file.bucket,
        sourceKey: file.objectName,
        targetBucket: file.bucket,
        targetKey,
        sourceExtension: file.extension,
        convertingOptions,
    }, {
        jobId,
        // removeOnComplete: true,
        // removeOnFail: true,
    })


    const job = await VideoConvertingJob.query().insert({
        queueJobId: jobId,
        sourceFileId: file.id,
        targetFileId: targetFile.id,
        requesterId: userId,
        status: VideoConvertingJob.STATUSES.PENDING,
        params: {
            convertingOptions,
        },
        requestedAt: new Date(),
    })

    return {
        jobId: job.id,
    }
}


export { compress }

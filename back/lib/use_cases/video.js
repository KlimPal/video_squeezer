import sharp from 'sharp'
import cf from '../utils/cf.js'
import config from '../../config.js'
import {
    emitError,
    errorCodes,
} from '../utils/error_utils.js'
import { User, File } from '../models/_index.js'
import { sha256hex } from '../utils/crypto.js'

import { videoConverting as videoConvertingQueue } from '../services/bull_queues.js'

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
    const file = await File.query().findById(validData.fileId)

    !file && emitError(errorCodes.notFound)

    const urlExpireInMs = cf.getDurationInMs({
        days: 7, // S3 limit: max is 7 days
    })

    let presignedGetUrl = file.getPresignedGetUrl(urlExpireInMs)

    const jobId = sha256hex(JSON.stringify(validData))
    console.log(jobId)
    videoConvertingQueue.add('input', {
        fileId: validData.fileId,
        presignedGetUrl,
        options: {
            height: validData.size,
            crf: validData.crf,
        },
    }, {
        jobId,
        // removeOnComplete: true,
        // removeOnFail: true,
    })

    return 'ok'
}


export { compress }

import Queue from 'bull'
import config from './config.js'
import { convertVideo } from './lib/use_cases/convert_video.js'
import cf from './lib/utils/cf.js'
import { videoConvertingInput, videoConvertingOutput } from './lib/services/bull_queues.js'
import { logger } from './lib/utils/pino_logger.js'

logger.info({
    inputQueue: {
        host: config.bullQueues.videoConvertingInput.host,
        queueName: config.bullQueues.videoConvertingInput.queueName,
        port: config.bullQueues.videoConvertingInput.port,
    },
    outputQueue: {
        host: config.bullQueues.videoConvertingOutput.host,
        queueName: config.bullQueues.videoConvertingOutput.queueName,
        port: config.bullQueues.videoConvertingOutput.port,
    },

}, 'Service is started')


videoConvertingInput.process(config.JOBS_CONCURRENCY, async (job) => {
    const rules = {
        sourceBucket: ['required', 'string'],
        sourceKey: ['required', 'string'],
        targetBucket: ['required', 'string'],
        targetKey: ['required', 'string'],
        sourceExtension: ['required', 'to_lc', { one_of: ['.mov', '.mp4', '.webm', '.mkv', '.zip'] }],
        targetExtension: ['required', { one_of: ['.mp4'] }],
        convertingOptions: ['required', {
            nested_object: {
                height: ['required', 'integer'],
                crf: ['required', 'integer'],
            },
        }],
        minioServer: ['required', {
            nested_object: {
                host: ['required', 'string'],
                port: ['required', 'integer'],
                accessKey: ['required', 'string'],
                encryptedSecretKey: ['required', 'string'],
            },
        }],
    }
    const validData = cf.livrValidate(rules, job.data)

    logger.info({
        jobData: job.data,
        jobId: job.id,
    }, 'Job received')

    const progress = percentage => job.progress(percentage)
    let result
    try {
        result = await convertVideo({
            jobId: job.id,
            jobData: validData,
            progressCallback: progress,
        })
    } catch (error) {
        await videoConvertingOutput.add({
            parentJobId: job.id,
            parentJobError: error.toString(),
        })
        return
    }

    await videoConvertingOutput.add({
        parentJobId: job.id,
        parentJobResult: result,
    })

    return result
})

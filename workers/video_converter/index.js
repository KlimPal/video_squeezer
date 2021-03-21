import Queue from 'bull'
import config from './config.js'
import { convertVideo } from './lib/use_cases/convert_video.js'
import cf from './lib/utils/cf.js'
import { videoConvertingInput, videoConvertingOutput } from './lib/services/bull_queues.js'
import { logger } from './lib/utils/pino_logger.js'

logger.info({
    s3Endpoint: config.s3.endPoint,
    s3Port: config.s3.port,
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
    console.log(job.data)

    const rules = {
        sourceBucket: ['required', 'string'],
        sourceKey: ['required', 'string'],
        targetBucket: ['required', 'string'],
        targetKey: ['required', 'string'],
        sourceExtension: ['required', { one_of: ['.mov', '.mp4'] }],
        convertingOptions: {
            nested_object: {
                height: ['required', 'integer'],
                crf: ['required', 'integer'],
            },
        },
    }
    const validData = cf.livrValidate(rules, job.data)

    logger.info({
        jobData: job.data,
        jobId: job.id,
    }, 'Job received')

    const progress = percentage => job.progress(percentage)
    const result = await convertVideo({
        jobData: validData,
        progressCallback: progress,
    })

    return result
})

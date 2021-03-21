import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const thisDirname = path.dirname(fileURLToPath(import.meta.url))


dotenv.config()

const redis = {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || 'password',
    tls: {
        rejectUnauthorized: false,
    },
}

const bullQueues = {
    videoConvertingInput: {
        queueName: process.env.INPUT_QUEUE_NAME,
        host: redis.host,
        port: redis.port,
        password: redis.password,
        tls: {
            rejectUnauthorized: false,
        },
    },
    videoConvertingOutput: {
        queueName: process.env.OUTPUT_QUEUE_NAME,
        host: redis.host,
        port: redis.port,
        password: redis.password,
        tls: {
            rejectUnauthorized: false,
        },
    },
}

const s3 = {
    accessKey: process.env.S3_ACCESS_KEY_ID,
    secretKey: process.env.S3_SECRET_KEY,
    endPoint: process.env.S3_END_POINT,
    port: Number(process.env.S3_PORT),
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    useSSL: process.env.S3_USE_SSL === 'true',
}

const JOBS_CONCURRENCY = Number(process.env.JOBS_CONCURRENCY) || 4
const tmpDirPath = path.join(thisDirname, 'tmp')

export default {
    redis,
    JOBS_CONCURRENCY,
    tmpDirPath,
    bullQueues,
    s3,
}

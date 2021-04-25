import path from 'path'
import { fileURLToPath } from 'url'

import dotenv from 'dotenv'

const indexPath = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(indexPath, '.env') })

const httpPort = process.env.HTTP_PORT || '8080'
const httpsPort = process.env.HTTPS_PORT || '8443'


const pgConnection = {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABSE,
    port: process.env.PG_PORT,
}


const webAppBaseUrl = process.env.webAppBaseUrl || 'http://localhost:4200'
const { GOOGLE_CLIENT_ID } = process.env
const { GOOGLE_CLIENT_SECRET } = process.env
const googleCallbackAddress = process.env.googleCallbackAddress || 'http://localhost:4200/authentication/google/callback'

const vapidKeys = {
    publicKey: process.env.VAPID_KEY_PUBLIC,
    privateKey: process.env.VAPID_KEY_PRIVATE,
}

const tgAuthBotToken = process.env.TG_AUTH_BOT_TOKEN

const gracefulShutdownFuncList = []

const monitoringPassword = process.env.monitoringPassword || 'password'

const minWsMsgSizeToGzip = 1024 * 5 // 5KB

const { keyForEncryptingMinioServerKey } = process.env

const imgproxyPublicBaseUrl = process.env.IMGPROXY_PUBLIC_BASE_URL


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
        queueName: 'video_converting_input',
        host: redis.host,
        port: redis.port,
        password: redis.password,
        tls: {
            rejectUnauthorized: false,
        },
    },
    videoConvertingOutput: {
        queueName: 'video_converting_output',
        host: redis.host,
        port: redis.port,
        password: redis.password,
        tls: {
            rejectUnauthorized: false,
        },
    },
}

export default {
    indexPath,
    httpPort,
    httpsPort,
    webAppBaseUrl,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    googleCallbackAddress,
    gracefulShutdownFuncList,
    vapidKeys,
    tgAuthBotToken,
    monitoringPassword,
    minWsMsgSizeToGzip,
    imgproxyPublicBaseUrl,
    pgConnection,
    bullQueues,
    keyForEncryptingMinioServerKey,
}

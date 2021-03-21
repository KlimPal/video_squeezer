import path from 'path'
import { fileURLToPath } from 'url'

import dotenv from 'dotenv'

const indexPath = path.dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: path.join(indexPath, '.env') })

let httpPort = process.env.HTTP_PORT || '8080'
let httpsPort = process.env.HTTPS_PORT || '8443'


let pgConnection = {
    host: process.env.PG_HOST,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABSE,
    port: process.env.PG_PORT,
}


let webAppBaseUrl = process.env.webAppBaseUrl || 'http://localhost:4200'
let { GOOGLE_CLIENT_ID } = process.env
let { GOOGLE_CLIENT_SECRET } = process.env
let googleCallbackAddress = process.env.googleCallbackAddress || 'http://localhost:4200/authentication/google/callback'

let vapidKeys = {
    publicKey: process.env.VAPID_KEY_PUBLIC,
    privateKey: process.env.VAPID_KEY_PRIVATE,
}

let tgAuthBotToken = process.env.TG_AUTH_BOT_TOKEN

let gracefulShutdownFuncList = []

let monitoringPassword = process.env.monitoringPassword || 'password'

let minWsMsgSizeToGzip = 1024 * 5 // 5KB

let s3 = {
    accessKey: process.env.S3_ACCESS_KEY_ID,
    secretKey: process.env.S3_SECRET_KEY,
    endPoint: process.env.S3_END_POINT,
    port: Number(process.env.S3_PORT),
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL,
    useSSL: process.env.S3_USE_SSL === 'true',
}

let imgproxyPublicBaseUrl = process.env.IMGPROXY_PUBLIC_BASE_URL

let templateReplacementMap = {
    S3_PUBLIC_BASE_URL: s3.publicBaseUrl,
}

const redis = {
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || '127.0.0.1',
    password: process.env.REDIS_PASSWORD || 'password',
    tls: {
        rejectUnauthorized: false,
    },
}

const bullQueues = {
    videoConverting: {
        queueName: 'video_converting',
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
    s3,
    imgproxyPublicBaseUrl,
    templateReplacementMap,
    pgConnection,
    bullQueues,
}

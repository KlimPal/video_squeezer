import minio from 'minio'
import config from '../../config.js'

const minioClient = new minio.Client({
    endPoint: config.s3.endPoint,
    port: config.s3.port,
    useSSL: config.s3.useSSL,
    accessKey: config.s3.accessKey,
    secretKey: config.s3.secretKey,
})


export {
    minioClient,
}

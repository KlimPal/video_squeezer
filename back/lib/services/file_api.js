import minio from 'minio'
import config from '../../config.js'
import cf from '../utils/cf.js'

const minioClient = new minio.Client({
    endPoint: config.s3.endPoint,
    port: config.s3.port,
    useSSL: config.s3.useSSL,
    accessKey: config.s3.accessKey,
    secretKey: config.s3.secretKey,
})

const defaultBucket = 'default'
const defaultRegion = 'us-east-1'
const bucketListToEnsure = ['default']


async function ensureBuckets() {
    await cf.sleep(5000)
    let created = (await minioClient.listBuckets()).map((el) => el.name)
    let bucketsToCreate = bucketListToEnsure.filter((el) => !created.includes(el))

    await Promise.all(bucketsToCreate.map((name) => minioClient.makeBucket(name, defaultRegion)))

    await minioClient.setBucketPolicy('default', JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: ['arn:aws:s3:::default/*'],
        }],
    }))
}
ensureBuckets().catch((err) => {
    console.error(err)
})


export {
    minioClient,
    defaultBucket,
}


export default {
    minioClient,
    defaultBucket,
}

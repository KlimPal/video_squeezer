import AWS from 'aws-sdk'


function getS3Client({
    host,
    port,
    accessKey,
    secretKey,
    region,
}) {
    return new AWS.S3({
        endpoint: `https://${host}:${port}`,
        signatureVersion: 'v4',
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        s3ForcePathStyle: true,
        region,
    })
}

async function concatObjects({
    sourceObjects, // {bucket, objectName}
    targetBucket, targetObjectName,
    s3Client,
}) {
    const multipartUpload = await s3Client.createMultipartUpload({
        Bucket: targetBucket,
        Key: targetObjectName,
    }).promise()

    try {
        const parts = await Promise.all(sourceObjects.map(async (sourceObject, index) => {
            const copyResult = await s3Client.uploadPartCopy({
                Bucket: multipartUpload.Bucket,
                CopySource: `${sourceObject.bucket}/${sourceObject.objectName}`,
                Key: multipartUpload.Key,
                UploadId: multipartUpload.UploadId,
                PartNumber: index + 1,
            }).promise()

            return {
                PartNumber: index + 1,
                ETag: copyResult.CopyPartResult.ETag,
            }
        }))

        const result = await s3Client.completeMultipartUpload({
            Bucket: multipartUpload.Bucket,
            Key: multipartUpload.Key,
            UploadId: multipartUpload.UploadId,
            MultipartUpload: {
                Parts: parts,
            },
        }).promise()


        return result
    } catch (e) {
        await s3Client.abortMultipartUpload({
            Bucket: multipartUpload.Bucket,
            Key: multipartUpload.Key,
            UploadId: multipartUpload.UploadId,
        }).promise()
        throw e
    }
}

export {
    concatObjects,
    getS3Client,
}

import childProcess from 'child_process'
import fetch from 'node-fetch'
import fs from 'fs-extra'
import path from 'path'
import progressStream from 'progress-stream'
import util from 'util'
import minio from 'minio'
import cf from '../utils/cf.js'
import config from '../../config.js'
import { logger } from '../utils/pino_logger.js'
import { aes256Decrypt } from '../utils/crypto.js'


function createMinioClient({
    host,
    port,
    accessKey,
    encryptedSecretKey,
    region,
}) {
    return new minio.Client({
        region,
        endPoint: host,
        port,
        useSSL: true,
        accessKey,
        secretKey: aes256Decrypt(encryptedSecretKey, config.keyForEncryptingMinioServerKey),
    })
}


const exec = util.promisify(childProcess.exec)

async function convertVideo({
    jobId,
    jobData: {
        sourceBucket,
        sourceKey,
        targetBucket,
        targetKey,
        sourceExtension,
        convertingOptions,
        targetExtension,
        minioServer,
    },
    progressCallback,
}) {
    const start = Date.now()
    const result = { bucket: targetBucket, key: targetKey }


    const tmpSourceFileName = `${cf.generateUniqueCode(24)}${sourceExtension}`
    const tmpSourcePath = path.join(config.tmpDirPath, tmpSourceFileName)

    const downloadStartedAt = Date.now()
    const filesToRemove = []

    try {
        filesToRemove.push(tmpSourcePath)

        const minioClient = createMinioClient({
            region: minioServer.region,
            host: minioServer.host,
            port: minioServer.port,
            accessKey: minioServer.accessKey,
            encryptedSecretKey: minioServer.encryptedSecretKey,
        })
        await minioClient.fGetObject(sourceBucket, sourceKey, tmpSourcePath)


        const fileStat = await fs.stat(tmpSourcePath)
        logger.info({
            jobId,
            stepName: 'DOWNLOAD_SOURCE_FILE',
            fileSize: fileStat.size,
            fileSizeAsString: cf.getFriendlyFileSize(fileStat.size),
            duration: Date.now() - downloadStartedAt,
        }, 'Job in progress')


        const { crf, height, ffmpegPreset = 'veryfast' } = convertingOptions

        let outputFileName
        let outputFilePath
        let command

        const convertingStartedAt = Date.now()

        const ffmpegOptions = `-filter:v scale=-2:${height} -c:v libx264 -preset ${ffmpegPreset} `
            + `-crf ${crf}`

        if (sourceExtension === '.zip') {
            const bashScriptPath = path.join(config.indexPath, 'lib', 'use_cases', 'utils', 'convert_videos_in_zip.sh')
            outputFileName = `${cf.generateUniqueCode(24)}_converted.zip`
            outputFilePath = path.join(config.tmpDirPath, outputFileName)
            filesToRemove.push(outputFilePath)
            command = `input_zip_path="${tmpSourcePath}" `
                + `output_zip_path="${outputFilePath}" `
                + `out_video_ext="${targetExtension}" `
                + `ffmpeg_options="${ffmpegOptions}" `
                + `sh ${bashScriptPath}`

            const { exitCode, stderr, stdout } = await cf.execCommand(command)

            if (exitCode !== 0) {
                throw new Error(stderr)
            }
        } else {
            outputFileName = `${cf.generateUniqueCode(24)}_converted${targetExtension}`
            outputFilePath = path.join(config.tmpDirPath, outputFileName)

            filesToRemove.push(outputFilePath)
            command = `ffmpeg -loglevel error -i "${tmpSourcePath}" `
                + `${ffmpegOptions} `
                + `"${outputFilePath}"`
            const { exitCode, stderr } = await cf.execCommand(command)
            if (exitCode !== 0) {
                throw new Error(stderr)
            }
        }

        const outputFileStat = await fs.stat(outputFilePath)

        logger.info({
            jobId,
            stepName: 'CONVERT',
            convertCommand: command,
            outputFileSize: outputFileStat.size,
            outputFileSizeAsString: cf.getFriendlyFileSize(outputFileStat.size),
            duration: Date.now() - convertingStartedAt,
        }, 'Job in progress')

        result.fileSize = outputFileStat.size
        result.fileSizeAsString = cf.getFriendlyFileSize(outputFileStat.size)
        result.outputFileName = outputFileName

        const uploadStartedAt = Date.now()
        await minioClient.fPutObject(targetBucket, targetKey, outputFilePath)

        logger.info({
            jobId,
            stepName: 'UPLOAD',
            duration: Date.now() - uploadStartedAt,
            outputFileSize: outputFileStat.size,
            outputFileSizeAsString: cf.getFriendlyFileSize(outputFileStat.size),
        }, 'Job completed')
    } catch (error) {
        await Promise.all(filesToRemove.map(path => fs.remove(path)))

        logger.error({
            error,
        })
        throw error
    } finally {
        await Promise.all(filesToRemove.map(path => fs.remove(path)))
    }

    result.jobDuration = Date.now() - start

    return result
}

export { convertVideo }

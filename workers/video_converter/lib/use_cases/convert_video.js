import childProcess from 'child_process'
import fetch from 'node-fetch'
import fs from 'fs-extra'
import path from 'path'
import progressStream from 'progress-stream'
import util from 'util'
import cf from '../utils/cf.js'
import config from '../../config.js'
import { minioClient } from '../services/minio.js'
import { logger } from '../utils/pino_logger.js'

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

        const outputFileName = `${cf.generateUniqueCode(24)}_converted.mp4`
        const outputFilePath = path.join(config.tmpDirPath, outputFileName)

        filesToRemove.push(outputFilePath)
        const command = `ffmpeg -loglevel error -i "${tmpSourcePath}" `
            + `-filter:v scale=-2:${height} -c:v libx264 -preset ${ffmpegPreset} `
            + `-crf ${crf} "${outputFilePath}"`

        const convertingStartedAt = Date.now()
        let { stderr } = await exec(command)
        stderr = stderr.trim()
        if (stderr) {
            throw new Error(stderr)
        }

        const outputFileStat = await fs.stat(outputFilePath)

        logger.info({
            jobId,
            stepName: 'CONVERT',
            ffmpegCommand: command,
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

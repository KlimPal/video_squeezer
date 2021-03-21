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


    const tmpSourceFileName = `${cf.generateUniqueCode(24)}_${sourceExtension}`
    const tmpSourcePath = path.join(config.tmpDirPath, tmpSourceFileName)

    const downloadStartAt = Date.now()
    await minioClient.fGetObject(sourceBucket, sourceKey, tmpSourcePath)

    const fileStat = await fs.stat(tmpSourcePath)
    logger.info({
        jobId,
        action: 'DOWNLOAD_SOURCE_FILE',
        fileSize: fileStat.size,
        fileSizeAsString: cf.getFriendlyFileSize(fileStat.size),
        duration: Date.now() - downloadStartAt,
    }, 'Job in progress')

    // try {
    //     const progressState = {
    //         download: {
    //             weight: 0.45,
    //             fileMap: {},
    //         },
    //         convert: {
    //             weight: 0.1,
    //         },
    //         upload: {
    //             weight: 0.45,
    //         },
    //     }

    //     await Promise.all(videoParts.map(async ({ sourceUrl, localPath }) => {
    //         const response = await fetch(sourceUrl, { method: 'get' })
    //         if (response.status !== 200) {
    //             throw new Error('Unable to download video part')
    //         }

    //         let partSize = Number(response.headers.get('content-length'))
    //         const progressWatcher = progressStream({
    //             length: partSize,
    //             time: 1000,
    //         })

    //         progressWatcher.on('progress', (progress) => {
    //             progressState.download.fileMap[localPath] = progress.percentage
    //             let values = Object.values(progressState.download.fileMap)
    //             progressCallback((cf.sum(values) / videoParts.length) * progressState.download.weight)
    //         })

    //         await cf.pipeToFinish(response.body, progressWatcher, fs.createWriteStream(localPath))
    //     }))

    //     let fileListData = videoParts.map(({ localPath }) => `file '${localPath}'`).join('\n')

    //     await fs.writeFile(fileListPath, fileListData)

    //     const command = `ffmpeg -f concat -safe 0 -loglevel error -i ${fileListPath} -c copy ${outputPath}`
    //     let { stderr } = await exec(command)
    //     stderr = stderr.trim()
    //     if (stderr) {
    //         throw new Error(stderr)
    //     }

    //     if (!await fs.pathExists(outputPath)) {
    //         throw new Error('Something went wrong. Output file not found.')
    //     }
    //     const downloadAndConvertProgress = 100 * (progressState.download.weight + progressState.convert.weight)
    //     progressCallback(downloadAndConvertProgress)

    //     let outputFileStat = await fs.stat(outputPath)

    //     await minioClient.fPutObject(targetBucket, targetKey, outputPath)
    //     progressCallback(100)


    //     result = {
    //         duration: Date.now() - start,
    //         outputFileSize: outputFileStat.size,
    //     }
    // } catch (e) {
    //     await Promise.all(filesToRemove.map(path => fs.remove(path)))

    //     console.log(e)
    //     throw e
    // } finally {
    //     await Promise.all(filesToRemove.map(path => fs.remove(path)))
    // }

    // console.log(`\nEnd job #${prefix}`)
    // console.log(`duration: ${result.duration} ms`)
    // console.log(`outputFileSize: ${cf.getFriendlyFileSize(result.outputFileSize)}`)

    return result
}

export { convertVideo }

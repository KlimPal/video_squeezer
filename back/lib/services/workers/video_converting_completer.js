import path from 'path'
import { videoConvertingOutput } from '../bull_queues.js'
import { VideoConvertingJob, File, User } from '../../models/_index.js'
import { logger } from '../../utils/pino_logger.js'
import { minioClient } from '../file_api.js'

const concurrency = 16


function initVideoConvertingCompleter() {
    videoConvertingOutput.process(concurrency, async (job) => {
        const parentJobId = job.data?.parentJobId
        const parentJobResult = job.data?.parentJobResult

        logger.info({
            jobId: job.id,
            jobType: 'COMPLETE_VIDEO_CONVERTING',
            jobData: job.data,
        }, 'Job received')

        const convertingJob = await VideoConvertingJob.query().findOne({
            queueJobId: parentJobId,
        })
        const targetFile = await File.query().findById(convertingJob.targetFileId)
        const sourceFile = await File.query().findById(convertingJob.sourceFileId)

        const fileStatFromS3 = await minioClient.statObject(targetFile.bucket, targetFile.objectName)


        // save original file name and replace extension
        const newExtension = path.extname(parentJobResult.outputFileName)
        const newFileName = sourceFile.originalFileName.replace(/\.[^.]+$/, newExtension)

        await targetFile.$query().update({
            status: File.STATUSES.UPLOAD_COMPLETED,
            size: fileStatFromS3.size,
            originalFileName: newFileName,
        })


        await convertingJob.$query().updateAndFetch({
            status: VideoConvertingJob.STATUSES.COMPLETED,
            completedAt: new Date(),
            result: parentJobResult,
        })
    })
}


export { initVideoConvertingCompleter }

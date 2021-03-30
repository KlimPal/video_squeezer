import path from 'path'
import { videoConvertingOutput } from '../bull_queues.js'
import { VideoConvertingJob, File, User } from '../../models/_index.js'
import { logger } from '../../utils/pino_logger.js'
import { minioClient } from '../file_api.js'
import { sendEvent } from '../../routers/handler_ws.js'
import cf from '../../utils/cf.js'

const concurrency = 16

const jobType = 'COMPLETE_VIDEO_CONVERTING'

function initVideoConvertingCompleter() {
    videoConvertingOutput.process(concurrency, async (job) => {
        const jobStartedAt = Date.now()
        try {
            const parentJobId = job.data?.parentJobId
            const parentJobResult = job.data?.parentJobResult

            logger.info({
                jobId: job.id,
                jobType,
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

            await targetFile.$query().updateAndFetch({
                status: File.STATUSES.UPLOAD_COMPLETED,
                size: fileStatFromS3.size,
                originalFileName: newFileName,
            })


            await convertingJob.$query().updateAndFetch({
                status: VideoConvertingJob.STATUSES.COMPLETED,
                completedAt: new Date(),
                result: parentJobResult,
            })

            await sendEvent({
                userIdList: [convertingJob.requesterId],
                eventName: 'CONVERTED_FILE_READY_TO_DOWNLOAD',
                data: {
                    jobId: convertingJob.id,
                    sourceFile,
                    convertedFile: targetFile,
                    linkToDownload: await targetFile.getPresignedGetUrl(cf.getDurationInMs({ days: 7 })),
                },
            })

            logger.info({
                jobId: job.id,
                jobType,
                duration: Date.now() - jobStartedAt,
            }, 'Job completed')
        } catch (error) {
            logger.error({
                jobId: job.id,
                jobType,
                duration: Date.now() - jobStartedAt,
                error,
            }, 'Job failed')
            throw error
        }
    })
}


export { initVideoConvertingCompleter }

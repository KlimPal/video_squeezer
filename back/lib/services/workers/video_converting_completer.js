import path from 'path'
import { videoConvertingOutput } from '../bull_queues.js'
import { VideoConvertingJob, File, User } from '../../models/_index.js'
import { logger } from '../../utils/pino_logger.js'
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
            const parentJobError = job.data?.parentJobError


            logger.info({
                jobId: job.id,
                jobType,
                jobData: job.data,
            }, 'Job received')


            const convertingJob = await VideoConvertingJob.query().findOne({
                queueJobId: parentJobId,
            })

            if (parentJobError) {
                await convertingJob.$query().updateAndFetch({
                    status: VideoConvertingJob.STATUSES.FAILED,
                    failedAt: new Date(),
                })
                logger.info({
                    jobId: job.id,
                    jobType,
                    duration: Date.now() - jobStartedAt,
                    parentJobError,
                }, 'Job completed (error)')
                await sendEvent({
                    userIdList: [convertingJob.requesterId],
                    eventName: 'CONVERTING_JOB_STATUS_CHANGED',
                    data: { },
                })
                return
            }
            const targetFile = await File.query().findById(convertingJob.targetFileId)
            const sourceFile = await File.query().findById(convertingJob.sourceFileId)

            const minioClient = await sourceFile.getMinioClient()
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
                eventName: 'CONVERTING_JOB_STATUS_CHANGED',
                data: { },
            })

            logger.info({
                jobId: job.id,
                jobType,
                duration: Date.now() - jobStartedAt,
            }, 'Job completed')
        } catch (error) {
            console.log(error)

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

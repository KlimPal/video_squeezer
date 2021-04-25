import objection from 'objection'
import { User, File } from './_index.js'
import { BaseModel } from './base.js'
import cf from '../utils/cf.js'
import config from '../../config.js'


class VideoConvertingJob extends BaseModel {
    id
    queueJobId
    sourceFileId
    targetFileId
    requesterId
    status
    params
    result
    requestedAt
    completedAt
    failedAt
    createdAt
    updatedAt
    deletedAt

    static STATUSES = {
        PENDING: 'PENDING',
        DISCARDED: 'DISCARDED',
        IN_PROGRESS: 'IN_PROGRESS',
        FAILED: 'FAILED',
        COMPLETED: 'COMPLETED',
    }


    static get tableName() {
        return 'videoConvertingJobs'
    }

    static get relationMappings() {
        return {
            sourceFile: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: File,
                join: {
                    from: 'videoConvertingJobs.sourceFileId',
                    to: 'files.id',
                },
            },
            targetFile: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: File,
                join: {
                    from: 'videoConvertingJobs.targetFileId',
                    to: 'files.id',
                },
            },
            requester: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'videoConvertingJobs.requesterId',
                    to: 'users.id',
                },
            },

        }
    }
}

export default VideoConvertingJob


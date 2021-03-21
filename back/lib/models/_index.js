import objection from 'objection'
import { knex } from '../services/knex/knex.js'
import User from './user.js'
import File from './file.js'
import Document from './document.js'
import FilePart from './file_part.js'
import VideoConvertingJob from './video_converting_job.js'

const { Model } = objection

Model.knex(knex)

export {
    User,
    File,
    Document,
    FilePart,
    VideoConvertingJob,
}

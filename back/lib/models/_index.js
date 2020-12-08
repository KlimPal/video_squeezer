import objection from 'objection'
import { knex } from '../services/knex/knex.js'
import User from './user.js'
import File from './file.js'
import Document from './document.js'

const { Model } = objection

Model.knex(knex)

export {
    User, File, Document,
}

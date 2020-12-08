import objection from 'objection'
import { knex } from '../services/knex/knex.js'
import User from './user.js'
import File from './file.js'
import Incident from './incident.js'
import Document from './document.js'
import IncidentView from './incident_view.js'

const { Model } = objection

Model.knex(knex)

export {
    User, File, Incident, Document, IncidentView,
}

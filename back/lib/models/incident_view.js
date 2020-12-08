import objection from 'objection'
import { Incident, User } from './_index.js'
import { BaseModel } from './base.js'

class IncidentView extends BaseModel {
    id
    userId
    incidentId
    date
    createdAt
    updatedAt

    static get tableName() {
        return 'incidentsViews'
    }

    static get relationMappings() {
        return {
            incident: {
                relation: objection.Model.HasOneRelation,
                modelClass: Incident,
                join: {
                    from: 'incidentsViews.incidentId',
                    to: 'incidents.id',
                },
            },
            user: {
                relation: objection.Model.HasOneRelation,
                modelClass: User,
                join: {
                    from: 'incidentsViews.userId',
                    to: 'users.id',
                },
            },
        }
    }
}

export default IncidentView


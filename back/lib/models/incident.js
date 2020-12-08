import objection from 'objection'
import { File, User, IncidentView } from './_index.js'
import { BaseModel } from './base.js'
import { postgis } from '../services/knex/knex.js'
import cf from '../utils/cf.js'

class Incident extends BaseModel {
    id
    title
    description
    duration
    radius
    authorId
    date
    attachedFileId
    terminationDate
    statistic
    location
    createdAt
    updatedAt


    attachedFile = new File()

    static get tableName() {
        return 'incidents'
    }
    static modifiers = {
        parseLocation(query) {
            query.select(postgis.x('location').as('longitude'), postgis.y('location').as('latitude'))
        },
    };


    static get relationMappings() {
        return {
            attachedFile: {
                relation: objection.Model.HasOneRelation,
                modelClass: File,
                join: {
                    from: 'incidents.attachedFileId',
                    to: 'files.id',
                },
            },
            author: {
                relation: objection.Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'incidents.authorId',
                    to: 'users.id',
                },
            },
        }
    }

    async addView(userId) {
        let existing = await IncidentView.query().findOne({
            userId,
            incidentId: this.id,
        })
        if (!existing) {
            await IncidentView.query().insert({
                incidentId: this.id,
                userId,
                date: new Date(),
            })

            await this.$query().patch({
                'statistic:views': this.statistic.views + 1,
            })
        }
    }


    async recalculateViews() {
        let count = (await IncidentView.query()
            .select('id')
            .where({
                incidentId: this.id,
            })).length
        await this.$query().patch({
            'statistic:views': count,
        })
        return count
    }

    static dump(instance) {
        return {
            id: instance.id,
            incidentId: instance.id,
            title: instance.title,
            description: instance.description,
            duration: instance.duration,
            radius: instance.radius,
            authorId: instance.authorId,
            date: instance.date,
            photoUrl: instance.attachedFile?.publicUrl,
            terminationDate: instance.terminationDate,
            statistic: instance.statistic,
            longitude: instance.longitude,
            latitude: instance.latitude,
        }
    }

    dump() {
        return Incident.dump(this)
    }
}

export default Incident


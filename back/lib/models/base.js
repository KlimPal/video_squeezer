import objection from 'objection'
import cf from '../utils/cf.js'
import { postgis } from '../services/knex/knex.js'

const { Model } = objection

export class BaseModel extends Model {
    $beforeInsert() {
        if (!this.id) {
            this.id = cf.generateUniqueCode()
        }
        this.createdAt = new Date()
        this.updatedAt = new Date()
    }

    $beforeUpdate() {
        this.updatedAt = new Date()
    }
    static get useLimitInFirst() {
        return true
    }
    static postgisUtils = {
        createLocation(longitude, latitude) {
            return postgis.setSRID(postgis.makePoint(longitude, latitude), 4326)
        },
        locationWithin(field, longitude, latitude, radius) {
            return postgis.dwithin(field, postgis.geography(postgis.makePoint(longitude, latitude)), radius)
        },
    }
}


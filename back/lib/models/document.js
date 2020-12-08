import objection from 'objection'
import { User } from './_index.js'
import { BaseModel } from './base.js'


class Document extends BaseModel {
    id
    data
    createdAt
    updatedAt

    static get tableName() {
        return 'documents'
    }
}

export default Document


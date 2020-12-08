import objection from 'objection'
import { File } from './_index.js'
import { BaseModel } from './base.js'
import { livrValidate } from '../utils/error_utils.js'
import { isPasswordValid, getPasswordHash } from '../utils/crypto.js'

class User extends BaseModel {
    id
    userName
    passwordHash
    email
    photoUrl
    profileSettings
    authenticationMethods
    createdAt
    updatedAt

    static get tableName() {
        return 'users'
    }

    static get relationMappings() {
        return {
            files: {
                relation: objection.Model.HasManyRelation,
                modelClass: File,
                join: {
                    from: 'users.id',
                    to: 'files.authorId',
                },
            },
        }
    }
}

export default User

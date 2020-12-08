import objection from 'objection'
import { File } from './_index.js'
import { BaseModel } from './base.js'
import { sendNotification, subscriptionLivrModel } from '../services/push_notification.js'
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

    setPushSubscription(subscription) {
        livrValidate({ subscription }, { subscription: subscriptionLivrModel })

        return this.$patch({
            'profileSettings.pushSubscription': subscription,
        })
    }

    get pushSubscription() {
        return this.profileSettings?.pushSubscription
    }

    async sendNotification({
        title = '', body = '', actions = [], data = {}, bageUrl = '', iconUrl = '',
    } = {}) {
        let subscription = this.profileSettings.pushSubscription
        if (!subscription) {
            throw new Error('invalid pushSubscription')
        }
        if (this.profileSettings.enablePushNotification === false) {
            throw new Error('notifications disabled for user')
        }

        return sendNotification(subscription, {
            title, body, actions, data, bageUrl, iconUrl,
        })
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


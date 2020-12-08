import sharp from 'sharp'
import cf from '../utils/cf.js'
import config from '../../config.js'
import {
    emitError,
    errorCodes,
} from '../utils/error_utils.js'
import { User, File } from '../models/_index.js'

getUser.rules = {
    userId: ['string', 'required'],
}
async function getUser(validData, { context }) {
    let user = await User.query().findById(validData.userId)
    if (!user) {
        emitError(errorCodes.userNotFound)
    }
    let result = {
        userId: user.id,
        userName: user.userName,
        photoUrl: cf.fillTemplate(user.photoUrl || '', config.templateReplacementMap),
    }
    if (context.userId == validData.userId) {
        result.settings = user.profileSettings
    }

    return result
}

updateProfileInfo.rules = {
    userName: ['string', 'required', { min_length: 3 }, { max_length: 30 }],
    settings: {
        nested_object: {
            enablePushNotification: ['boolean', 'required'],
        },
    },
}
async function updateProfileInfo(validData, { context }) {
    await User.query().findById(context.userId).patch({
        userName: validData.userName,
        'profileSettings.enablePushNotification': validData.settings.enablePushNotification,
    })

    return 'ok'
}

getClientConfig.public = true
async function getClientConfig() {
    let clientConfig = {
        imgproxyBaseUrl: config.imgproxyPublicBaseUrl,
        publicVapidKey: config.vapidKeys.publicKey,
    }
    return clientConfig
}

export {
    getUser,
    updateProfileInfo,
    getClientConfig,
}

import sharp from 'sharp'
import cf from '../utils/cf.js'
import config from '../../config.js'
import {
    emitError, errorCodes,
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


updateSelfLocation.rules = {
    latitude: ['decimal', 'required', { min_number: -90 }, { max_number: 90 }],
    longitude: ['decimal', 'required', { min_number: -180 }, { max_number: 180 }],
    date: ['integer', 'required'],
}
async function updateSelfLocation(validData, { context }) {
    let user = await User.query().findById(context.userId)
    if (!user) {
        emitError(errorCodes.userNotFound)
    }
    await user.$query().patch({
        location: User.postgisUtils.createLocation(validData.longitude, validData.latitude),
    })
    return 'ok'
}

updateProfilePhoto.rules = {
    fileId: ['string', 'required'],
}
async function updateProfilePhoto(validData, { context }) {
    let file = await File.query().findById(validData.fileId)
    if (!file) {
        emitError(errorCodes.invalidParameters, {
            fileId: errorCodes.notFound,
        })
    }
    if (file.authorId !== context.userId) {
        emitError(errorCodes.notPermitted)
    }
    let inputStream = await file.getStream()

    let optimizer = sharp()
        .rotate()
        .resize({ width: 800 })
        .webp()

    inputStream.pipe(optimizer)

    let optimizedFile = await File.create(optimizer, {
        authorId: context.userId,
        metaData: {
            'Content-Type': 'image/webp',
        },
    })

    await User.query().findById(context.userId).patch({
        photoUrl: optimizedFile.publicUrlTemplate,
    })
    await file.$query().delete()

    return 'ok'
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


async function getClientConfig() {
    let clientConfig = {
        imgproxyBaseUrl: config.imgproxyPublicBaseUrl,
        publicVapidKey: config.vapidKeys.publicKey,
    }
    return clientConfig
}

export {
    getUser,
    updateSelfLocation,
    updateProfilePhoto,
    updateProfileInfo,
    getClientConfig,
}

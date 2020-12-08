import sharp from 'sharp'
import config from '../../config.js'
import { sendEvent } from '../routers/sharedSocketHandler.js'
import {
    File, Incident,
} from '../models/_index.js'
import {
    emitError, errorCodes,
} from '../utils/error_utils.js'


createIncident.rules = {
    title: ['string', 'required', { min_length: 1 }, { max_length: 30 }],
    description: ['string', { max_length: 1000 }],
    duration: ['decimal', 'required', { min_number: 10 * 1000 }, { max_number: 1000 * 60 * 60 * 24 }],
    radius: ['decimal', 'required', { min_number: 1 }, { max_number: 1000 }],
    latitude: ['decimal', 'required', { min_number: -90 }, { max_number: 90 }],
    longitude: ['decimal', 'required', { min_number: -180 }, { max_number: 180 }],
    attachedFileId: ['string'],
}
async function createIncident(validData, { context }) {
    let dateNow = Date.now()
    let incident = await Incident.query().insert({
        date: new Date(dateNow),
        authorId: context.userId,
        title: validData.title,
        description: validData.description,
        radius: validData.radius,
        duration: validData.duration,
        location: Incident.postgisUtils.createLocation(validData.longitude, validData.latitude),
        terminationDate: new Date(dateNow + validData.duration),
        statistic: {
            views: 0,
        },
    })

    if (validData.attachedFileId) {
        setTimeout(async () => {
            let file = await File.query().findById(validData.attachedFileId)
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
                .resize({ width: 1200 })
                .webp()

            inputStream.pipe(optimizer)

            let optimizedFile = await File.create(optimizer, {
                authorId: context.userId,
                metaData: {
                    'Content-Type': 'image/webp',
                },
            })
            await incident.$query().patch({
                attachedFileId: optimizedFile.id,
            })
            await file.$query().delete()
        })
    }

    // sendNotificationsAboutIncident(incident.id)

    return incident.id
}

// async function sendNotificationsAboutIncident(incidentId) {
//     try {
//         let incident = await mApi.findOne(config.dbPath.incident, { incidentId })

//         let usersToNotify = await mApi.findMany(config.dbPath.user, {
//             location: {
//                 $near: {
//                     $geometry: { type: 'Point', coordinates: incident.location.coordinates },
//                     $minDistance: 0,
//                     $maxDistance: incident.radius,
//                 },
//             },
//             userId: { $ne: incident.author },
//             // 'pushSubscription.endpoint': { $exists: true },
//             // 'settings.enablePushNotification': true,

//         })

//         let userIdList = usersToNotify.map((el) => el.userId)
//         sendEvent({
//             eventName: 'map_update',
//             data: { incidentId, type: 'add' },
//             userIdList,
//         })

//         // for (let user of usersToNotify) {
//         //     let result = await sendNotification(user.userId, {
//         //         title: 'New incident: ' + incident.title,
//         //         body: incident.description
//         //     })
//         // }
//     } catch (e) {
//         console.log(e)
//     }
// }


getIncidents.rules = {
    incidentId: ['string'],
    author: ['string'],
    allowOutdated: 'boolean',
    limit: ['integer', { default: 1000 }],
    offset: ['integer', { default: 0 }],
    near: {
        nested_object: {
            maxDistance: ['decimal', { default: 1000 }, { min_number: 0 }, { max_number: 1000 * 1000 * 100 }],
            latitude: ['decimal', 'required', { min_number: -90 }, { max_number: 90 }],
            longitude: ['decimal', 'required', { min_number: -180 }, { max_number: 180 }],
        },
    },
}
async function getIncidents(validData, { context }) {
    if (validData.allowOutdated && validData.author !== context.userId && !validData.incidentId) {
        emitError('allowOutdated=true allowed when author=yourUseId or when incidentId specified')
    }
    let incidents = await Incident.query()
        .select('*')
        .modify('parseLocation')
        .where((builder) => {
            if (validData.incidentId) {
                builder.where('id', validData.incidentId)
            }
            if (validData.author) {
                builder.where('authorId', validData.author)
            }

            if (!validData.allowOutdated) {
                builder.where('terminationDate', '>', new Date())
            }
            if (validData.near) {
                let { near } = validData
                builder.where(Incident.postgisUtils.locationWithin('location', near.longitude, near.latitude, near.maxDistance))
            }
        })
        .withGraphFetched('attachedFile')
        .offset(validData.offset)
        .limit(validData.limit)

    incidents = incidents.map((el) => el.dump())

    return incidents
}


increaseViews.rules = {
    incidentId: ['string', 'required'],
}
async function increaseViews(validData, { context }) {
    let incident = await Incident.query().findById(validData.incidentId)
    if (!incident) {
        emitError(errorCodes.notFound)
    }
    await incident.addView(context.userId)
    return 'ok'
}

removeIncident.rules = {
    incidentId: ['string', 'required'],
}
async function removeIncident(validData, { context }) {
    let incident = await Incident.query().findById(validData.incidentId)
    if (!incident) {
        return 'ok'
    }
    if (incident.authorId !== context.userId) {
        emitError(errorCodes.notPermitted)
    }
    await incident.$query().delete()

    sendEvent({
        eventName: 'map_update',
        data: { incidentId: validData.incidentId, type: 'remove' },
        broadcast: true,
    })
    return 'ok'
}

export {
    createIncident,
    getIncidents,
    increaseViews,
    removeIncident,
}

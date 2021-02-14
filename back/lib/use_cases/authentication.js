import googleapis from 'googleapis'
import crypto from 'crypto'
import cf from '../utils/cf.js'
import config from '../../config.js'
import { getJson } from '../utils/http_client.js'
import {
    emitError, errorCodes,
} from '../utils/error_utils.js'
import { User, Document } from '../models/_index.js'


const { google } = googleapis

let sessionList = []

let googleAuth = {
    client: new google.auth.OAuth2(
        config.GOOGLE_CLIENT_ID,
        config.GOOGLE_CLIENT_SECRET,
        config.googleCallbackAddress,
    ),
}

function getClientIpByExpressReq(req) {
    let xForwardedFor = req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0].trim()
    return xForwardedFor || req.headers['x-real-ip'] || req.connection.remoteAddress
}

function getGoogleOauthUrl() {
    return googleAuth.client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/plus.login',
        ],
    })
}

getOauthUrl.public = true
getOauthUrl.rules = {
    type: ['required', { one_of: ['google'] }],
}
function getOauthUrl({ type }) {
    const urls = {
        google: getGoogleOauthUrl,
    }
    let url = urls[type]()
    if (!url) {
        emitError(errorCodes.unknownError)
    }
    return url
}


getToken.rules = {
    googleAuthCode: 'string',
    telegramAuthData: {
        nested_object: {
            auth_date: 'integer',
            first_name: 'string',
            last_name: 'string',
            hash: 'string',
            id: 'integer',
            photo_url: 'string',
            username: 'string',

        },
    },
}
getToken.public = true
async function getToken({ googleAuthCode, telegramAuthData }) {
    if (googleAuthCode) {
        let { tokens } = await googleAuth.client.getToken(googleAuthCode)
        googleAuth.client.setCredentials(tokens)
        let googleProfile = await getJson('https://www.googleapis.com/oauth2/v1/userinfo', {
            alt: 'json',
            access_token: tokens.access_token,
        })

        let user = await User.query().findOne(User.ref('authenticationMethods:google.id').castText(), googleProfile.id)
        if (!user) {
            user = await registerUser({ googleProfile })
        }
        let session = await generateSession(user.id)
        if (!session) {
            throw new Error('invalid user')
        }
        cf.logger.info(`User ${user.userName}(${user.id}) logged in`)
        return session.token
    }

    if (telegramAuthData) {
        let authHash = telegramAuthData.hash
        delete telegramAuthData.hash

        let dataCheck = []
        for (let key in telegramAuthData) {
            dataCheck.push(`${key}=${telegramAuthData[key]}`)
        }
        let dataCheckStr = dataCheck.sort().join('\n')

        const secretKey = crypto.createHash('sha256').update(config.tgAuthBotToken).digest()
        const hash = crypto.createHmac('sha256', secretKey).update(dataCheckStr).digest('hex')

        if (authHash !== hash) {
            emitError('INVALID_AUTH_HASH')
        }

        // telegramAuthData.auth_date in seconds
        if (Date.now() - telegramAuthData.auth_date * 1000 > 1000 * 10) {
            emitError(errorCodes.sessionOutdated)
        }

        let user = await User.query().findOne(User.ref('authenticationMethods:telegram.id').castText(), telegramAuthData.id)
        if (!user) {
            user = await registerUser({ telegramAuthData })
        }
        let session = await generateSession(user.id)
        if (!session) {
            emitError(errorCodes.internalError)
        }
        cf.logger.info(`User ${user.userName}(${user.id}) logged in`)
        return session.token
    }

    emitError(errorCodes.invalidParameters)
}

async function registerUser({ googleProfile, telegramAuthData }) {
    let userName
    let photoUrl
    let authenticationMethods
    if (googleProfile) {
        userName = googleProfile.name
        photoUrl = googleProfile.picture
        authenticationMethods = {
            google: {
                id: googleProfile.id,
                ...googleProfile,
            },
        }
    }

    if (telegramAuthData) {
        userName = telegramAuthData.username
        photoUrl = telegramAuthData.photo_url
        authenticationMethods = {
            telegram: {
                id: `${telegramAuthData.id}`,
                ...telegramAuthData,
            },
        }
    }

    if (!userName) {
        emitError(errorCodes.internalError)
    }
    let user = await User.query().insert({
        userName,
        photoUrl,
        authenticationMethods,
        profileSettings: {
            enablePushNotification: true,
        },
    })

    return user
}

async function generateSession(userId) {
    let user = await User.query().findById(userId)
    if (!user) {
        emitError(errorCodes.userNotFound)
    }
    let dateNow = Date.now()
    let session = {
        sessionId: cf.generateUniqueCode(),
        token: cf.generateUniqueCode(64),
        userId: user.id,
        creationDate: dateNow,
        lastActivityDate: dateNow,
        expired: false,
    }
    sessionList.push(session)
    return session
}

async function getUserIdByToken(token) {
    for (let session of sessionList) {
        if (session && session.token === token) {
            session.lastActivityDate = Date.now()
            return session.userId
        }
    }
    return null
}

checkSession.public = true
checkSession.rules = {
    token: ['required', 'string'],
    getUserInfo: ['boolean', {
        default: false,
    }],
}
function checkSession({ token, getUserInfo }, { context }) {
    for (let session of sessionList) {
        if (session && session.token === token) {
            context.userId = session.userId
            context.sessionId = session.sessionId
            session.lastActivityDate = Date.now()
            if (getUserInfo) {
                return { userId: session.userId }
            }
            return 'ok'
        }
    }
    return 'error'
}

logout.rules = {
    token: ['required', 'string'],
}
function logout({ token }, { context }) {
    for (let i = 0; i < sessionList.length; i++) {
        let session = sessionList[i]
        if (session && session.sessionId === context.sessionId) {
            sessionList[i] = null
            context.userId = null
            context.sessionId = null
        }
        if (session && session.token === token) {
            sessionList[i] = null
            context.userId = null
            context.sessionId = null
        }
    }
    return 'ok'
}


const sessionsDocumentType = 'sessions'
async function retrieveSessionsFromDb() {
    let document = await Document.query().findOne({
        type: sessionsDocumentType,
    })
    if (document && document.data && document.data.list.length) {
        sessionList = [...sessionList, ...document.data.list]
    }
}

retrieveSessionsFromDb()

config.gracefulShutdownFuncList.push(async () => {
    let sessionsToSave = sessionList.filter((el) => el)
    await Document.query().delete().where({
        type: sessionsDocumentType,
    })
    if (sessionList.length > 0) {
        await Document.query().insert({
            type: sessionsDocumentType,
            data: { list: sessionsToSave },
        })
    }
})

export {
    getClientIpByExpressReq,
    getOauthUrl,
    checkSession,
    getToken,
    logout,
}

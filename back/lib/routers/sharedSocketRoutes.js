import * as modules from '../use_cases/_index.js'

const methods = {
    ping: async () => 'pong',
    'user.get': modules.user.getUser,
    'user.updateSelfLocation': modules.user.updateSelfLocation,
    'user.updateProfilePhoto': modules.user.updateProfilePhoto,
    'user.updateProfileInfo': modules.user.updateProfileInfo,
    'user.getClientConfig': modules.user.getClientConfig,

    'authentication.getOauthUrl': modules.authentication.getOauthUrl,
    'authentication.checkSession': modules.authentication.checkSession,
    'authentication.getToken': modules.authentication.getToken,
    'authentication.logout': modules.authentication.logout,

    'files.getPresignedPutObjectUrl': modules.files.getPresignedPutObjectUrl,

    'notification.addPushSubscription': modules.notification.addPushSubscription,
    getApiRules,
}


function getApiRules() {
    let doc = {
        ...methods,
    }
    for (let key in doc) {
        doc[key] = doc[key].rules || null
    }
    return doc
}


export default methods

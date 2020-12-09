import * as modules from '../use_cases/_index.js'

const methods = {
    ping: async () => 'pong',
    'user.get': modules.user.getUser,
    'user.updateProfileInfo': modules.user.updateProfileInfo,
    'user.getClientConfig': modules.user.getClientConfig,

    'authentication.getOauthUrl': modules.authentication.getOauthUrl,
    'authentication.checkSession': modules.authentication.checkSession,
    'authentication.getToken': modules.authentication.getToken,
    'authentication.logout': modules.authentication.logout,

    'files.getPresignedPutObjectUrl': modules.files.getPresignedPutObjectUrl,
    'files.getPartialUpload': modules.files.getPartialUpload,

    getApiRules,
}


getApiRules.public = true;
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

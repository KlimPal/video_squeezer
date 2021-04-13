import * as useCases from '../use_cases/_index.js'

const methods = {
    ping: async () => 'pong',
    'user.get': useCases.user.getUser,
    'user.updateProfileInfo': useCases.user.updateProfileInfo,
    'user.getClientConfig': useCases.user.getClientConfig,

    'authentication.getOauthUrl': useCases.authentication.getOauthUrl,
    'authentication.checkSession': useCases.authentication.checkSession,
    'authentication.getToken': useCases.authentication.getToken,
    'authentication.logout': useCases.authentication.logout,

    'files.getPresignedPutObjectUrl': useCases.files.getPresignedPutObjectUrl,
    'files.getPartialUpload': useCases.files.getPartialUpload,
    'files.completeFilePart': useCases.files.completeFilePart,
    'files.completePartialUpload': useCases.files.completePartialUpload,
    'files.getOwnFiles': useCases.files.getOwnFiles,

    'video.compress': useCases.video.compress,
    'video.getOwnConvertingJobs': useCases.video.getOwnConvertingJobs,

    getApiRules,
}


getApiRules.public = true
function getApiRules() {
    const doc = {
        ...methods,
    }
    for (const key in doc) {
        doc[key] = doc[key].rules || null
    }
    return doc
}


export default methods

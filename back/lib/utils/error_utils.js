import cf from './cf.js'


const errorCodes = {
    internalError: 'INTERNAL_ERROR',
    invalidSession: 'INVALID_SESSION',
    sessionOutdated: 'SESSION_OUTDATED',
    invalidParameters: 'INVALID_PARAMETERS',
    notPermitted: 'NOT_PERMITTED',
    unknownError: 'UNKNOWN_ERROR',
    jsonParseError: 'JSON_PARSE_ERROR',
    invalidMethod: 'INVALID_METHOD',
    userNotFound: 'USER_NOT_FOUND',
    notFound: 'NOT_FOUND',
}


class SwsError extends Error {
    constructor(errorCode, details) {
        super(errorCode)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, SwsError)
        }
        this.name = 'SwsError'
        this.errorCode = errorCode
        this.details = details
    }
}

function emitError(errorCode, details) {
    throw new SwsError(errorCode, details)
}

function livrValidate(rules, data) {
    const validator = new cf.livr.Validator(rules)
    const validData = validator.validate(data)

    if (!validData) {
        throw new SwsError(errorCodes.invalidParameters, validator.getErrors())
    } else {
        return validData
    }
}
function validateSession(context) {
    if (!context.userId) {
        emitError(errorCodes.invalidSession)
    }
}


export {
    errorCodes,
    SwsError,
    emitError,
    validateSession,
    livrValidate,

}


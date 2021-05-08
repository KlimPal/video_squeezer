import pino from 'pino'

let destination = null // default to stdout

const logFileDestination = process.env.PINO_LOG_TO_FILE

if (logFileDestination) {
    destination = pino.destination({
        dest: logFileDestination,
        sync: false,
    })
}

const logger = pino({
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
        error: pino.stdSerializers.err,
    },
    level: process.env.PINO_LOG_LEVEL || 'info',
}, destination)

const logTypes = {
    INTERNAL: 'INTERNAL',
    API_RESPONSE: 'API_RESPONSE',
    API_CALL: 'API_CALL'
}

export { logger, logTypes }

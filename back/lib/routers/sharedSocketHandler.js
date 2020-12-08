import util from 'util'
import zlib from 'zlib'
import _ from 'lodash'
import { getClientIpByExpressReq } from '../use_cases/authentication.js'
import { customMetrics, promClientRegister } from '../use_cases/metrics.js'
import config from '../../config.js'
import {
    errorCodes, emitError, SwsError, livrValidate, validateSession,
} from '../utils/error_utils.js'
import methods from './sharedSocketRoutes.js'
import cf from '../utils/cf.js'


const gzip = util.promisify(zlib.gzip)
const sharedSocketClients = new Set()


function handleConnection(ws, req) {
    try {
        let context = {
            ip: getClientIpByExpressReq(req),
            userId: null,
            sessionId: null,
        }
        let clientInfo = { context, ws }
        sharedSocketClients.add(clientInfo)

        ws.on('message', async (msg = '') => {
            let endDurationMetric = customMetrics.sharedSocketRequestDuration.startTimer()
            try {
                try {
                    msg = JSON.parse(msg)
                } catch {
                    emitError(errorCodes.jsonParseError)
                }

                if (!msg.method || !methods[msg.method]) {
                    emitError(errorCodes.invalidMethod)
                }

                let method = methods[msg.method]
                let { data } = msg
                if (method.public !== true) {
                    validateSession(context)
                }
                if (method.rules) {
                    data = livrValidate(method.rules, data)
                }
                let result = await method(_.cloneDeep(data), { context, msg })
                let response = JSON.stringify({
                    data: {
                        result,
                    },
                    id: msg.id,
                })
                if (response.length > config.minWsMsgSizeToGzip) {
                    response = await gzip(response)
                }


                ws.send(response)
                cf.logger.info({
                    userId: context.userId, method: msg.method, data, type: 'API_CALL',
                })
            } catch (err) {
                let data = { error: errorCodes.unknownError }

                if (err instanceof SwsError) {
                    data.error = err.errorCode
                    data.details = err.details
                } else {
                    console.error(err)
                }

                ws.send(JSON.stringify({ data, id: msg.id }))
            }
            endDurationMetric({ method: msg.method })
            customMetrics.sharedSocketRequestCount.labels(msg.method).inc(1)
        })
        ws.on('error', (err) => {
            console.log(err)
        })
        ws.on('close', () => {
            sharedSocketClients.delete(clientInfo)
        })
    } catch (e) {
        console.error(e)
    }
}

async function sendEvent({
    broadcast = false,
    userIdList = [],
    sessionIdList = [],
    eventName = '',
    data = null,
}) {
    let clientsToNotify = []
    const allClient = [...sharedSocketClients]
    if (broadcast) {
        clientsToNotify = allClient
    } else {
        let clientsById = allClient.filter((el) => el.context && el.context.userId && userIdList.includes(el.context.userId))
        let clientsBySessionId = allClient.filter((el) => el.context && el.context.sessionId && userIdList.includes(el.context.sessionId))
        clientsToNotify = [...clientsById, ...clientsBySessionId]
    }
    let msg = JSON.stringify({ event: eventName, data })
    for (let client of clientsToNotify) {
        client.ws.send(msg)
    }
}

export {
    sendEvent,
    handleConnection,
}

export default {
    handleConnection,
    sendEvent,
}

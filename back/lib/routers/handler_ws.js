import util from 'util'
import zlib from 'zlib'
import _ from 'lodash'
import { getClientIpByExpressReq } from '../use_cases/authentication.js'
import { customMetrics, promClientRegister } from '../use_cases/metrics.js'
import config from '../../config.js'
import {
    errorCodes, emitError, SwsError, livrValidate, validateSession,
} from '../utils/error_utils.js'
import methods from './rpc_routes.js'
import cf from '../utils/cf.js'


const gzip = util.promisify(zlib.gzip)
const sharedSocketClients = new Set()


function handleWsRpcConnection(ws, req) {
    try {
        const context = {
            ip: getClientIpByExpressReq(req),
            userId: null,
            sessionId: null,
        }
        const clientInfo = { context, ws }
        sharedSocketClients.add(clientInfo)

        ws.on('message', async (msg = '') => {
            const traceId = cf.generateUniqueCode(16)
            const defaultLogData = { traceId, userId: context.userId }
            const startRequestTime = Date.now()

            const endDurationMetric = customMetrics.sharedSocketRequestDuration.startTimer()
            try {
                try {
                    msg = JSON.parse(msg)
                } catch {
                    emitError(errorCodes.jsonParseError)
                }
                defaultLogData.method = msg.method

                if (!msg.method || !methods[msg.method]) {
                    emitError(errorCodes.invalidMethod)
                }

                const method = methods[msg.method]
                let { data } = msg
                if (method.public !== true) {
                    validateSession(context)
                }
                if (method.rules) {
                    data = livrValidate(method.rules, data)
                }
                cf.logger.info({
                    ...defaultLogData, data, type: cf.logTypes.API_CALL,
                }, 'API call')

                const result = await method(_.cloneDeep(data), { context, msg })
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

                cf.logger.debug({
                    ...defaultLogData,
                    data: result,
                    type: cf.logTypes.API_RESPONSE,
                    duration: Date.now() - startRequestTime,
                }, 'API response')
            } catch (err) {
                const data = { error: errorCodes.unknownError }

                if (err instanceof SwsError) {
                    data.error = err.errorCode
                    data.details = err.details

                    cf.logger.debug({
                        ...defaultLogData,
                        data,
                        type: cf.logTypes.API_RESPONSE,
                        duration: Date.now() - startRequestTime,
                    }, 'API response (error)')
                } else {
                    console.error(err)
                    cf.logger.error({
                        ...defaultLogData,
                        error: err,
                        type: cf.logTypes.API_RESPONSE,
                        duration: Date.now() - startRequestTime,
                    }, 'API response (unknown error)')
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
        const clientsById = allClient.filter((el) => el.context && el.context.userId && userIdList.includes(el.context.userId))
        const clientsBySessionId = allClient.filter((el) => el.context && el.context.sessionId && userIdList.includes(el.context.sessionId))
        clientsToNotify = [...clientsById, ...clientsBySessionId]
    }

    const msg = JSON.stringify({ event: eventName, data })
    for (const client of clientsToNotify) {
        client.ws.send(msg)
    }
}

export {
    sendEvent,
    handleWsRpcConnection,
}

export default {
    handleWsRpcConnection,
    sendEvent,
}

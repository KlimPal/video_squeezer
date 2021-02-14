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


async function handleHttpRpcRequest(req, res) {
    let context = {
        ip: getClientIpByExpressReq(req),
        userId: null,
        sessionId: null,
    }

    const msg = req.body
    console.log(msg)

    let endDurationMetric = customMetrics.sharedSocketRequestDuration.startTimer()

    try {
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

        res.json({
            data: result,
        })

        cf.logger.info({
            userId: context.userId, method: msg.method, data, type: 'API_CALL',
        })
    } catch (err) {
        console.log(err)
        let data = { error: errorCodes.unknownError }

        if (err instanceof SwsError) {
            data.error = err.errorCode
            data.details = err.details
        } else {
            console.error(err)
        }

        res.json({
            data,
        })
    }
    endDurationMetric({ method: msg.method })
    customMetrics.sharedSocketRequestCount.labels(msg.method).inc(1)
}


export {
    handleHttpRpcRequest,
}

export default {
    handleHttpRpcRequest,
}

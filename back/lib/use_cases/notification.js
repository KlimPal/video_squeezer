import {
    emitError, errorCodes,
} from '../utils/error_utils.js'
import { User } from '../models/_index.js'

import { subscriptionLivrModel } from '../services/push_notification.js'


addPushSubscription.rules = {
    subscription: subscriptionLivrModel,
}

async function addPushSubscription(validData, { context }) {
    let user = await User.query().findById(context.userId)
    if (!user) {
        emitError(errorCodes.userNotFound)
    }
    await user.setPushSubscription(validData)

    return 'ok'
}


export {
    addPushSubscription,
}

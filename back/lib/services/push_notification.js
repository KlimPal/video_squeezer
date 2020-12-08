import webpush from 'web-push'
import config from '../../config.js'

webpush.setVapidDetails(
    'mailto:test@klimpal.com',
    config.vapidKeys.publicKey,
    config.vapidKeys.privateKey,
)


async function sendNotification(subscription, {
    title = '', body = '', actions = [], data = {}, bageUrl = '', iconUrl = '',
} = {}) {
    const notificationPayload = {
        notification: {
            title,
            body,
            badge: bageUrl || 'https://i.pinimg.com/originals/f2/57/78/f25778f30e29a96c44c4f72ef645aa63.png',
            icon: iconUrl,
            vibrate: [100, 50, 100],
            data,
            actions,
        },
    }

    return webpush.sendNotification(subscription, JSON.stringify(notificationPayload))
}
const subscriptionLivrModel = {
    nested_object: {
        endpoint: ['string', 'required'],
        keys: {
            nested_object: {
                p256dh: ['string', 'required'],
                auth: ['string', 'required'],
            },
        },
    },
}


export { sendNotification, subscriptionLivrModel }

import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { sendWsMsg } from '../utils/sharedSocket'
import { appState } from '../globalConfig'

@Injectable({
    providedIn: 'root'
})
export class PushNotificationService {

    constructor(
        private swPush: SwPush,
    ) {

        swPush.notificationClicks.subscribe((event) => {
            console.log(event);
        })
        swPush.messages.subscribe((event) => {
            console.log(event);
        })

    }

    async subscribeToNotifications() {
        let subscription = await this.swPush.requestSubscription({
            serverPublicKey: appState.clientConfig.publicVapidKey
        })
        //console.log(subscription);
        let data = await sendWsMsg('notification.addPushSubscription', { subscription: subscription })
        console.log(data);
        if (data.result == 'ok') {
            return
        } else {
            throw new Error(data.error || 'error while addPushSubscription');
        }
    }
}

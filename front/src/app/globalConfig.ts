/*
 *  Copyright (C) Novel Tax Systems Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential
 *  * Written by Oleksandr Zhmurko and Klim Palamarchuk,  2018 - 2019
 *
 */

const browserWindow = window || {};
const browserWindowEnv = browserWindow['__env'] || {};

const nodeRootAddress = browserWindowEnv.httpApiBaseUrl
const nodeWsRootAddress = browserWindowEnv.wsApiBaseUrl

export { nodeRootAddress, nodeWsRootAddress };

export let appState = {
    connectionWithBackendStatus: 'ok',
    user: {
        userName: '',
        userId: '',
        sessionId: '',
        token: '',
    },
    cache: {
        profile: {
            photoUrl: '',
            userName: '',
            settings: {
                enablePushNotification: false,
            }
        }
    },
    clientConfig: {
        imgproxyBaseUrl: '',
        publicVapidKey: ''
    }
};

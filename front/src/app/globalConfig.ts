/*
 *  Copyright (C) Novel Tax Systems Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential
 *  * Written by Oleksandr Zhmurko and Klim Palamarchuk,  2018 - 2019
 *
 */

let baseHref = '';

function getBaseHref() {
    let el = document.querySelector('base');
    if (!el) {
        return window.location.origin
    }
    let result = el.href.split('').slice(0, -1).join('');
    return result
}
baseHref = getBaseHref();

let nodeRootAddress = baseHref;
let nodeWsRootAddress = baseHref.replace(/.*\/\//, 'wss://');

if (baseHref.match(/:(42\d\d)|(8080)|(8443)/)) {
    if (baseHref.match(/localhost:/)) {
        nodeRootAddress = window.location.origin
            .replace(/https?(.*):42\d\d/, 'http$1:8080');
    } else {
        nodeRootAddress = window.location.origin
            .replace(/https?(.*):42\d\d/, 'https$1:8443');
    }
    nodeWsRootAddress = window.location.origin
        .replace(/:42\d\d/, ':8080')
        .replace(/.*\/\//, 'ws://');
}

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

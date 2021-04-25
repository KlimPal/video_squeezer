import { appState, nodeWsRootAddress } from '../globalConfig'
import { cf } from './cf'
import { EventEmitter } from '@angular/core'
import { ungzip } from './workersWrapper'

let socket
let socketClosed = true;
let socketOnOpen = new EventEmitter()

let responseEmitters = {}
let eventsFromBackend = new EventEmitter()

function initConection() {
    socket = new WebSocket(nodeWsRootAddress + '/api/sharedSocket');
    socket.onopen = function () {
        appState.connectionWithBackendStatus = 'ok';
        socketOnOpen.emit()
        socketClosed = false;
    };

    socket.onclose = (event) => {
        appState.connectionWithBackendStatus = 'error';
        socketClosed = true;
        setTimeout(() => { initConection() }, 5000)
    };
    socket.onmessage = async (event) => {
        let data = event.data;
        try {
            if (data instanceof Blob) {
                //let start = Date.now()
                let head = data.slice(0, 2)
                let arr = new Uint8Array(await new Response(head).arrayBuffer())
                // gzip-ed file starts with bytes 0x1f 0x8b
                if (arr[0] == 0x1f && arr[1] == 0x8b) {
                    let uint8Array = new Uint8Array(await new Response(data).arrayBuffer())
                    data = await ungzip(uint8Array)
                } else {
                    throw 'binary data is not a gzip'
                }
                //console.log(Date.now() - start);
            }

            data = JSON.parse(data)
        } catch (e) {
            console.log(e);
        }
        if (data.id && responseEmitters[data.id]) {
            responseEmitters[data.id].emit(data)
        }


        if (data.event) {
            eventsFromBackend.emit({ event: data.event, data: data.data })
        }
        appState.connectionWithBackendStatus = 'ok';
        socketClosed = false;
    };
    socket.onerror = (error) => {
        appState.connectionWithBackendStatus = 'error';
        socketClosed = true;

    };
}
initConection()

async function sendWsMsg(method, data = null, connectionTimeout = 3000): Promise<any> {
    if (socketClosed) {
        await new Promise((resolve) => {
            let subscription = socketOnOpen.subscribe(() => {
                resolve(null)
            })
            setTimeout(() => {
                subscription.unsubscribe()
                resolve(null)
            }, connectionTimeout)

        })
        if (socketClosed) {
            return { error: 'Connection timeout' }
        }
    }
    let id = cf.generateUniqueCode()
    socket.send(JSON.stringify({ method, data, id }))
    let event = new EventEmitter()
    responseEmitters[id] = event
    return new Promise((resolve, reject) => {
        event.subscribe((msg) => {
            delete responseEmitters[id]
            resolve(msg.data)
        })
    })

}



export { sendWsMsg, socketOnOpen, eventsFromBackend }

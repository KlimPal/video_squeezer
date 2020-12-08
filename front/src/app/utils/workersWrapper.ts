import { cf } from './cf'

const workers = {
    ungzip: new Worker('./workers/ungzip.worker', { type: 'module' })
}
const handlers = {}

function runWorker(data, workerName) {
    let key = cf.generateUniqueCode()
    return new Promise((resolve, reject) => {
        try {
            handlers[key] = { resolve, reject }
            workers[workerName].postMessage({ key, data })
        } catch (e) {
            delete handlers[key]
            reject(e)
        }
    })
}

for (let worker of Object.values(workers)) {
    worker.onmessage = function(e) {
        //console.log(e);
        if (e.data.error) {
            handlers[e.data.key].reject(e.data.error)
        } else {
            handlers[e.data.key].resolve(e.data.result)
        }
        delete handlers[e.data.key]
    }
}

export function ungzip(uint8Array) {
    return runWorker(uint8Array, 'ungzip')
}

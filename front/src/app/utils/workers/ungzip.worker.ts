/// <reference lib="webworker" />
import * as pako from 'pako'

addEventListener('message', ({ data: { key, data } }) => {
    try{
        let result = pako.ungzip(data, { to: "string" })
        postMessage({ key, result: result});
    }catch(err){
        postMessage({ key, error: err});
    }
});

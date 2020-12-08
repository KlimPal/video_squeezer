import fetch from 'node-fetch'

async function postJson(url, obj) {
    let response = await fetch(url, {
        body: JSON.stringify(obj),
        method: 'post',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    let result = await response.json()
    return result
}

async function putJson(url, obj) {
    let response = await fetch(url, {
        body: JSON.stringify(obj),
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    let result = await response.json()
    return result
}

async function deleteJson(url, obj) {
    let response = await fetch(url, {
        body: JSON.stringify(obj),
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    let result = await response.json()
    return result
}

async function getJson(url, params = {}) {
    let query = `?${Object.keys(params)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
        .join('&')}`
    let response = await fetch(url + query, {
        method: 'get',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    let result = await response.json()
    return result
}

export {
    postJson,
    getJson,
    putJson,
    deleteJson,
}

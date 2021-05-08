import pathToRegexpDefault from 'path-to-regexp'

const { pathToRegexp } = pathToRegexpDefault

class WebSocketHandler {
    constructor(wsServer) {
        this.wsServer = wsServer
    }

    on(routerName, cb) {
        const exp = pathToRegexp(routerName)
        this.wsServer.on('connection', (ws, req) => {
            if (req.url.match(exp)) {
                cb(ws, req)
            }
        })
    }
}

export {
    WebSocketHandler,
}

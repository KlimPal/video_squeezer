import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import fs from 'fs'
import WebSocket from 'ws'
import basicAuth from 'express-basic-auth'
import cors from 'cors'
import config from './config.js'
import { WebSocketHandler } from './lib/utils/webSocketHandler.js'
import { handleWsRpcConnection } from './lib/routers/handler_ws.js'
import { handleHttpRpcRequest } from './lib/routers/handler_http.js'
import { exportMetricsMiddleware } from './lib/use_cases/metrics.js'


const app = express()

const httpServer = http.createServer(app)

const wsServer = new WebSocket.Server({ server: httpServer })
const wsApp = new WebSocketHandler(wsServer)

httpServer.listen(config.httpPort, () => console.log(`http server on ${config.httpPort} port`))

app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))


app.use(express.static(`${config.indexPath}/public`, {
    extensions: ['html'],
    maxAge: '1w',
}))


wsApp.on('/api/sharedSocket', handleWsRpcConnection)
app.post('/api/rpc', handleHttpRpcRequest)


app.get('/api/metrics', basicAuth({ users: { admin: config.monitoringPassword } }), exportMetricsMiddleware)

app.use((req, res) => {
    res.sendFile(`${config.indexPath}/public/index.html`)
})

app.use((err, req, res, _) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})


const shutDownSignals = ['SIGINT', 'SIGTERM', 'SIGUSR2']

shutDownSignals.forEach((signal) => {
    process.on(signal, async () => {
        try {
            await Promise.all(config.gracefulShutdownFuncList.map((el) => el()))
            process.exit()
        } catch (e) {
            console.log(e)
            process.exit()
        }
    })
})


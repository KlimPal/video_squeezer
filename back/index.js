import express from 'express'
import bodyParser from 'body-parser'
import http from 'http'
import https from 'https'
import fs from 'fs'
import WebSocket from 'ws'
import basicAuth from 'express-basic-auth'
import cors from 'cors'
import config from './config.js'
import { WebSocketHandler } from './lib/utils/webSocketHandler.js'
import sharedSocketHandler from './lib/routers/sharedSocketHandler.js'

import { exportMetricsMiddleware } from './lib/use_cases/metrics.js'

const httpsOptions = {
    key: fs.readFileSync('./cert/private.key', 'utf8'),
    cert: fs.readFileSync('./cert/full_bundle.crt', 'utf8'),
    requestCert: false,
    rejectUnauthorized: false,
}

const app = express()

const httpServer = http.createServer(app)
const httpsServer = https.createServer(httpsOptions, app)

const wsServer = new WebSocket.Server({ server: httpServer })
const wsApp = new WebSocketHandler(wsServer)

const wssServer = new WebSocket.Server({ server: httpsServer })
const wssApp = new WebSocketHandler(wsServer)


httpServer.listen(config.httpPort, () => console.log(`http server on ${config.httpPort} port`))
httpsServer.listen(config.httpsPort, () => console.log(`https server on ${config.httpsPort} port`))

app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))


app.use(express.static(`${config.indexPath}/public`, {
    extensions: ['html'],
    maxAge: '1w',
}))


wsApp.on('/sharedSocket', sharedSocketHandler.handleConnection)
wssApp.on('/sharedSocket', sharedSocketHandler.handleConnection)

app.get('/metrics', basicAuth({ users: { admin: config.monitoringPassword } }), exportMetricsMiddleware)

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


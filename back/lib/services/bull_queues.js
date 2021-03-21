import Queue from 'bull'
import config from '../../config.js'

const queueConfigs = config.bullQueues


const videoConverting = new Queue(queueConfigs.videoConverting.queueName, {
    redis: {
        host: queueConfigs.videoConverting.host,
        port: queueConfigs.videoConverting.port,
        password: queueConfigs.videoConverting.password,
        tls: queueConfigs.videoConverting.tls,
    },
})

export {
    videoConverting,
}

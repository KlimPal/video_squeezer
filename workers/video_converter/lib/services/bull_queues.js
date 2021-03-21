import Queue from 'bull'
import config from '../../config.js'

const configA = config.bullQueues.videoConvertingInput
const configB = config.bullQueues.videoConvertingOutput

const videoConvertingInput = new Queue(configA.queueName, {
    redis: {
        host: configA.host,
        port: configA.port,
        password: configA.password,
        tls: configA.tls,
    },
})

const videoConvertingOutput = new Queue(configB.queueName, {
    redis: {
        host: configB.host,
        port: configB.port,
        password: configB.password,
        tls: configB.tls,
    },
})

export {
    videoConvertingInput,
    videoConvertingOutput,
}

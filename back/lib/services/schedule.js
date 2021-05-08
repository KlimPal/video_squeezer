import cron from 'node-cron'
import config from '../../config.js'
import MinioServer from '../models/minio_server.js'

const jobs = []
async function startSchedule() {
    const checkMinioServer = cron.schedule('*/5 * * * *', async () => {
        await MinioServer.prepareMinioServers()
    })
    jobs.push(checkMinioServer)
}

async function stopSchedule() {
    jobs.forEach((job) => {
        job.stop()
    })
}
config.gracefulShutdownFuncList.push(stopSchedule)


export { startSchedule }

import MinioServer from '../models/minio_server.js'

async function prepareResources() {
    await MinioServer.prepareMinioServers()
}

export { prepareResources }

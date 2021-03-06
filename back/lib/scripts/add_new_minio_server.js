import { Command } from 'commander'
import { MinioServer } from '../models/_index.js'

const program = new Command()
program
    .option('-p, --port <port>', 'PORT', Number.parseInt)
    .option('-h, --host <host>', 'HOST')
    .option('-a, --access-key <accessKey>', 'ACCESS_KEY')
    .option('-s, --secret-key <secretKey>', 'SECRET_KEY')
    .option('-r, --region <region>', 'REGION')
    .option('-b, --bucket <bucket>', 'BUCKET')

program.parse(process.argv)

const options = program.opts()

async function main() {
    await MinioServer.createServer({
        host: options.host,
        port: options.port,
        accessKey: options.accessKey,
        secretKey: options.secretKey,
        region: options.region,
        bucket: options.bucket,
    })
    console.log('Done')
    process.exit(0)
}
main()


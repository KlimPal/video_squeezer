import { Command } from 'commander'
import { MinioServer } from '../models/_index.js'

const program = new Command()
program
    .requiredOption('-p, --port <port>', 'PORT', Number.parseInt)
    .requiredOption('-h, --host <host>', 'HOST')
    .requiredOption('-a, --access-key <accessKey>', 'ACCESS_KEY')
    .requiredOption('-s, --secret-key <secretKey>', 'SECRET_KEY')

program.parse(process.argv)

const options = program.opts()

async function main() {
    await MinioServer.createServer({
        host: options.host,
        port: options.port,
        accessKey: options.accessKey,
        secretKey: options.secretKey,
    })
    console.log('Done')
}
main()


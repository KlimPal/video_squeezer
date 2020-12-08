import config from '../../../config.js'

export default {
    client: 'pg',
    connection: config.pgConnection,
    migrations: {
        tableName: 'migrations',
    },
}

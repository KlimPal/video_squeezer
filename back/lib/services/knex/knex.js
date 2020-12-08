import Knex from 'knex'
import knexPostgis from 'knex-postgis'
import objection from 'objection'

import knexConfig from './knexfile.js'

const knex = Knex({ ...knexConfig, ...objection.knexSnakeCaseMappers() })
const postgis = knexPostgis(knex)

export { knex, postgis }

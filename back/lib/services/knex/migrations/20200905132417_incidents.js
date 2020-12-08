export function up(knex, Promise) {
    return knex.raw('CREATE EXTENSION IF NOT EXISTS postgis')
        .then(() => knex.schema.createTable('incidents', (table) => {
            table.string('id', 16).primary()
            table.text('title')
            table.text('description')
            table.integer('duration')
            table.float('radius')
            table.string('author_id', 16).references('id').inTable('users')
            table.timestamp('date')
            table.string('attached_file_id', 16).references('id').inTable('files')
            table.timestamp('termination_date')
            table.jsonb('statistic')
            table.specificType('location', 'geometry(point, 4326)')
            table.timestamp('created_at').defaultTo(knex.fn.now())
            table.timestamp('updated_at').defaultTo(knex.fn.now())
            table.timestamp('deleted_at')
        }))
}

export function down(knex, Promise) {
    return knex.schema.dropTable('incidents')
}

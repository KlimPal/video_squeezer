export function up(knex, Promise) {
    return knex.schema.createTable('incidents_views', (table) => {
        table.string('id', 16).primary()
        table.string('user_id', 16).references('id').inTable('users').onDelete('SET NULL')
        table.string('incident_id', 16).references('id').inTable('incidents').onDelete('CASCADE')
        table.timestamp('date')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })
}

export function down(knex, Promise) {
    return knex.schema.dropTable('incidents_views')
}

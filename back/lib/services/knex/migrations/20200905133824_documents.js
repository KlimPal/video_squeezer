export function up(knex, Promise) {
    return knex.schema.createTable('documents', (table) => {
        table.string('id', 16).primary()
        table.string('type')
        table.jsonb('data')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })
}

export function down(knex, Promise) {
    return knex.schema.dropTable('documents')
}

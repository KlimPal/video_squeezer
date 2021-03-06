export function up(knex, Promise) {
    return knex.schema.createTable('files', (table) => {
        table.string('id', 16).primary()
        table.string('bucket')
        table.string('object_name', 1024)
        table.string('status')
        table.string('hash')
        table.jsonb('meta_data')
        table.bigInteger('size')
        table.string('author_id', 16).references('id').inTable('users').onDelete('SET NULL')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })
}

export function down(knex, Promise) {
    return knex.schema.dropTable('files')
}

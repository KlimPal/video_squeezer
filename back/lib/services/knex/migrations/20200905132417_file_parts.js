export function up(knex, Promise) {
    return knex.schema.createTable('file_parts', (table) => {
        table.string('id', 16).primary()
        table.string('file_id', 16).references('id').inTable('files').onDelete('CASCADE')
        table.string('bucket')
        table.string('object_name', 1024)
        table.integer('size')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })
}

export function down(knex, Promise) {
    return knex.schema.dropTable('incidents')
}

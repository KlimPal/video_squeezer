export function up(knex, Promise) {
    return knex.schema.alterTable('files', (table) => {
        table.string('original_file_name', 255)
    })
}

export function down(knex, Promise) {
    return knex.schema.alterTable('files', (table) => {
        table.dropColumn('original_file_name')
    })
}

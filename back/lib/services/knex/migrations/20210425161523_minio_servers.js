export async function up(knex, Promise) {
    await knex.schema.createTable('minio_servers', (table) => {
        table.string('id', 16).primary()
        table.string('host').notNullable()
        table.integer('port').notNullable()
        table.string('status')
        table.text('access_key')
        table.text('encrypted_secret_key')
        table.string('region')
        table.string('bucket')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })

    await knex.schema.alterTable('files', (table) => {
        table.string('minio_server_id', 16).references('id').inTable('minio_servers').onDelete('CASCADE')
    })
    await knex.schema.alterTable('file_parts', (table) => {
        table.string('minio_server_id', 16).references('id').inTable('minio_servers').onDelete('CASCADE')
    })
}

export async function down(knex, Promise) {
    await knex.schema.alterTable('files', (table) => {
        table.dropColumn('minio_server_id')
    })
    await knex.schema.alterTable('file_parts', (table) => {
        table.dropColumn('minio_server_id')
    })
    await knex.schema.dropTable('minio_servers')
}

export function up(knex, Promise) {
    return knex.raw('CREATE EXTENSION IF NOT EXISTS postgis')
        .then(() => knex.schema.createTable('users', (table) => {
            table.string('id', 16).primary()
            table.string('user_name').notNullable()
            table.string('email')
            table.string('password_hash', 128) // hex(sha512).length
            table.text('photo_url')
            table.jsonb('profile_settings')
            table.jsonb('authentication_methods')
            table.specificType('location', 'geometry(point, 4326)')
            table.timestamp('created_at').defaultTo(knex.fn.now())
            table.timestamp('updated_at').defaultTo(knex.fn.now())
            table.timestamp('deleted_at')
        }))
}

export function down(knex, Promise) {
    return knex.schema.dropTable('users')
}

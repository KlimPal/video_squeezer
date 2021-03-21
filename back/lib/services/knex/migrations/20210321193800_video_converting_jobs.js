export function up(knex, Promise) {
    return knex.schema.createTable('video_converting_jobs', (table) => {
        table.string('id', 16).primary()
        table.string('queue_job_id')
        table.string('source_file_id', 16).references('id').inTable('files').onDelete('SET NULL')
        table.string('target_file_id', 16).references('id').inTable('files').onDelete('SET NULL')
        table.string('requester_id', 16).references('id').inTable('users').onDelete('SET NULL')
        table.string('status')
        table.jsonb('params')
        table.jsonb('result')
        table.timestamp('requested_at')
        table.timestamp('completed_at')
        table.timestamp('failed_at')
        table.timestamp('created_at').defaultTo(knex.fn.now())
        table.timestamp('updated_at').defaultTo(knex.fn.now())
        table.timestamp('deleted_at')
    })
}

export function down(knex, Promise) {
    return knex.schema.dropTable('video_converting_jobs')
}

import promClient from 'prom-client'

const {
    collectDefaultMetrics, Registry, Counter, Gauge, Histogram,
} = promClient

const register = new Registry()

collectDefaultMetrics({ register })

function exportMetricsMiddleware(req, res) {
    res.set('Content-Type', register.contentType)
    res.end(register.metrics())
}

const customMetrics = {
    sharedSocketRequestCount: new Counter({
        name: 'nodejs_shared_socket_request_count',
        help: 'shared socket request total count',
        labelNames: ['method'],
        registers: [register],
    }),
    sharedSocketRequestDuration: new Histogram({
        name: 'nodejs_shared_socket_request_duration',
        help: 'shared socket request duration',
        labelNames: ['method'],
        registers: [register],
    }),

}
const promClientRegister = register

export {
    exportMetricsMiddleware,
    promClientRegister,
    customMetrics,
}

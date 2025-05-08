const { createLogger, transports } = require("winston")
const  LokiTransport  = require("winston-loki")

const options = {
    transports : [
        new LokiTransport({
            host: "http://localhost:3100",
        }),
    ]
}

const logger = createLogger(options)

module.exports = logger
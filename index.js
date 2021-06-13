const Server = require('./src/Server')

const PORT = 3000
const HOST = '0.0.0.0'
const FILE_PATH = '/media'
const OUTPUT_PATH = '/output'

Server.start(PORT, HOST, FILE_PATH, OUTPUT_PATH)
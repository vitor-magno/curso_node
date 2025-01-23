const htpp = require('http');
const app = require('./app');
const port = process.env.PORT || 3000;
const server = htpp.createServer(app)
server.listen(port);
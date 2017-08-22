const https = require('https');
const fs = require('fs');

const env = process.env;

const port = env['GENESIS_PORT'] || 1127;
const certFile = env['GENESIS_CERT_FILE'];
const keyFile = env['GENESIS_KEY_FILE'];

console.log(`Genesis Port: ${port}`);

let serverConfig = {};

if(certFile && keyFile) {
    console.log('Building WebSocket Server with SSL');

    const server = https.createServer({
        cert: fs.readFileSync(certFile),
        key: fs.readFileSync(keyFile)
    });
    server.listen(port);

    serverConfig.server = server;
} else {
    serverConfig.port = port;
}

export default serverConfig;

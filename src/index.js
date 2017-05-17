import _ from 'lodash';
import bodyParser from 'body-parser';
import express from 'express';
import WebSocket from 'ws';

// Config
const port = process.env['GENESIS_PORT'] || 1127;

// WEB SOCKETS
let uidCounter = 0;
const sockets = {};

const server = new WebSocket.Server({port});
server.on('connection', ws => {
    console.log('Client connected.');

    const uid = ++uidCounter;
    ws.data = {uid};
    sockets[uid] = ws;

    // Send existng data
    const allUserData = _.values(sockets).map(socket => socket.data);
    sendJsonToAll(allUserData);

    ws.on('message', msg => {
        const {cmd, args} = JSON.parse(msg);

        console.log(`Command: ${cmd}`);
        console.log(args);

        switch(cmd) {
            case 'set':
                let data = ws.data;
                _.assign(data, args);

                sendJsonToAll(data);
                break;
            default:
                console.log(`Command "${cmd}" has no handler`);
                break;
        }
    });

    ws.on('close', () => {
        delete sockets[ws.data.uid];
        console.log('Client disconnected.');
    });
});
console.log(`Genesis now listening on port ${port}`);

function sendJsonToAll(data) {
    const json = JSON.stringify(data);
    _.values(sockets).map(socket => {
        socket.send(json);
    });
}

// HTTP
const app = express();

app.use(bodyParser.json());

app.get('/test', (req, res) => {
    res.json({ test: 'This is a test' });
});

app.post('/post-test', (req, res) => {
    let result = { postTest: 'This is a POST test', body: req.body};
    console.log(JSON.stringify(result, null, 2));
    res.json(result);
});

const httpPort = port + 1;
app.listen(httpPort, () => {
    console.log(`Genesis-API now listening on port ${httpPort}`);
});

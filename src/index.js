import {install} from 'source-map-support';
install();

import _ from 'lodash';
import WebSocket from 'ws';

// Config
const port = process.env['GENESIS_PORT'] || 1127;

// WEB SOCKETS
let uidCounter = 0;
const sockets = {};

const commands = {};

commands['pong'] = () => {};

commands['player_update'] = (ws, vectorPath) => {
    // Update player data and send to others
    ws.data.vectorPath = vectorPath;

    const uid = ws.data.uid;
    sendJsonToAll({cmd: "player_update", args: {uid, vectorPath}}, uid);
};

commands['set'] = (ws, args) => {
    const {data} = ws;
    _.assign(data, args);

    sendJsonToAll(data);
};

commands['sync'] = (ws, args) => {
    const serverTime = Date.now() + 15000;
    sendCmd(ws, 'sync', { clientTime: args, serverTime});
};

const server = new WebSocket.Server({port});
server.on('connection', ws => {
    console.log('Client connected.');

    const uid = ++uidCounter;
    ws.data = {uid, ping: -1};
    sockets[uid] = ws;

    // Send existng data
    const allUserData = _.values(sockets).map(socket => socket.data);
    sendJsonToAll(allUserData);

    ws.pingInterval = setInterval(() => ping(ws), 1000);

    ws.on('message', msg => {
        const {cmd, args} = JSON.parse(msg);

        const command = commands[cmd];
        if(!command) {
            console.log(`Command "${cmd}" has no handler`);
            return;
        }

        command(ws, args);
    });

    ws.on('close', () => {
        clearInterval(ws.pingInterval);

        delete sockets[ws.data.uid];
        console.log('Client disconnected.');
    });
});
console.log(`Genesis now listening on port ${port}`);

function ping(ws) {
    let start, stop;
    const pongListener = msg => {
        stop = Date.now();
        const {cmd} = JSON.parse(msg);

        if(cmd !== 'pong')
            return;

        ws.removeListener('message', pongListener);

        const pingTime = stop - start;
        ws.data.ping = pingTime;
    };

    ws.on('message', pongListener);
    start = Date.now();

    sendCmd(ws, 'ping', ws.data.ping);
}

function send(ws, data) {
    let msg;
    try {
        msg = JSON.stringify(data);
    } catch (e) {
        console.error(e, data);
    }
    ws.send(msg);
}

function sendCmd(ws, cmd, args) {
    const data = {cmd, args};
    send(ws, data);
}

function sendJsonToAll(data, exclude) {
    exclude = _.isArray(exclude) ? exclude : [exclude];

    // We do this instead of send() for efficiency
    const json = JSON.stringify(data);
    _.values(sockets).map(socket => {
        const uid = socket.data.uid;
        if(exclude.includes(uid))
            return;

        socket.send(json);
    });
}

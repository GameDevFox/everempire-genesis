import {install} from 'source-map-support';
install();

import WebSocket from 'ws';

import Session from './session';
import SessionList from './session-list';

import GenesisCommands from './common/commands';
import buildCommands from './commands';

// Config
const port = process.env['GENESIS_PORT'] || 1127;

const sessionList = new SessionList();
const commands = buildCommands(sessionList);

// TODO; Fix this circular dependency
sessionList.commands = commands;

// WEB SOCKETS
const server = new WebSocket.Server({port});
server.on('connection', ws => {
    console.log('Client connected.');

    const session = new Session(ws);
    session.on(GenesisCommands.AUTH, () => {
        sessionList.add(session);
    });
});
console.log(`Genesis now listening on port ${port}`);

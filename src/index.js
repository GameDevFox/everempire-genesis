import 'source-map-support/register';

import WebSocket from 'ws';

import Commands from './common/commands';
import Session from './session';
import SessionList from './session-list';

import ping from './commands/ping';
import buildPlayerUpdate from './commands/player-update';

// Config
const port = process.env['GENESIS_PORT'] || 1127;

const sessionList = new SessionList();

// Build and add commands to session list
const {commands} = sessionList;

const playerUpdate = buildPlayerUpdate(sessionList);
commands[Commands.PING] = ping;
commands[Commands.PLAYER_UPDATE] = playerUpdate;

// Setup WebSocket server
const server = new WebSocket.Server({port});
server.on('connection', ws => {
    console.log('Client connected.');

    const session = new Session(ws);
    session.on(Commands.AUTH, () => {
        sessionList.add(session);
    });
});
console.log(`Genesis now listening on port ${port}`);

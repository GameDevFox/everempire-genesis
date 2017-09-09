import 'source-map-support/register';

import WebSocket from 'ws';

import ping from './commands/ping';
import buildPlayerUpdate from './commands/player-update';

import Commands from './common/commands';
import EmpireService from './common/empire-service';
import Session from './common/session';

import ServerRestClient from './server/server-rest-client';
import ServerSocket from './server/server-socket';

// import ClientGroup from './util/client-group';

import Client from './client';
import ClientList from './client-list';

import { empireServiceToken, empireServiceUrl, serverConfig } from './config';

const clientList = new ClientList();

// Build and add commands to session list
const { commands } = clientList;

const playerUpdate = buildPlayerUpdate(clientList);
commands[Commands.PING] = ping;
commands[Commands.PLAYER_UPDATE] = playerUpdate;

const restService = ServerRestClient(empireServiceUrl, empireServiceToken);
const empireService = EmpireService(restService);

// Setup WebSocket server
const server = new WebSocket.Server(serverConfig);
server.on('connection', ws => {
  console.log('Client connected.');

  const socket = new ServerSocket(ws);
  const session = new Session(socket);
  const client = new Client(session);

  const onAuth = msg => {
    console.log('Trying to authenticate');

    empireService.getMe(null, { token: msg.data }).then(me => {
      console.log(`Authentication Success. User Id: ${me.id}`);
      const userId = me.id;
      client.userId = userId;

      // Remove AUTH
      client.commands.removeListener(Commands.AUTH, onAuth);

      // Add to Client List
      clientList.add(client);

      msg.respond({ data: userId });
    });
  };
  client.commands.on(Commands.AUTH, onAuth);

  // unauthGroup.add(client);
});

console.log(`Genesis now listening for connections`);

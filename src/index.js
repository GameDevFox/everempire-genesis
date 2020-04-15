import 'source-map-support/register';

import WebSocket from 'ws';

import ping from './commands/ping';
import buildPlayerUpdate from './commands/player-update';

import Channel from './common/channel';
import Commands from './common/commands';
import EmpireService from './common/empire-service';

import ServerRestClient from './server/server-rest-client';
import ServerSocket from './server/server-socket';

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

const AuthHandler = client => {
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

  return onAuth;
};

// Setup WebSocket server
const server = new WebSocket.Server(serverConfig);
server.on('connection', ws => {
  console.log('Client connected.');

  const { sendToSocket, sendToChannel } = new ServerSocket(ws);
  const channel = new Channel(sendToSocket);
  sendToChannel(channel);

  const client = new Client(channel);

  const authHandler = AuthHandler(client);
  client.commands.on(Commands.AUTH, authHandler);

  // unauthGroup.add(client);
});

console.log('Genesis now listening for connections');

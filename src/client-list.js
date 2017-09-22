import _ from 'lodash';

import Events from './common/events';

export default class ClientList {
  constructor() {
    this.commands = {};
    this.clients = {};
  }

  add(client) {
    client.channel.on(Events.MESSAGE, ({ cmd, data }) => {
      if(!cmd)
        return;

      const command = this.commands[cmd];
      if(!command) {
        console.warn(`No [${cmd}] command found for userId: ${client.userId}`);
        return;
      }

      command(client, data);
    });

    client.channel.on(Events.CLOSE, () => {
      delete this.clients[client.userId];
      console.log('Client disconnected.');
    });

    this.clients[client.userId] = client;
  }

  commandAll(cmd, data, exclude) {
    this.sendToAll({ cmd, data }, exclude);
  }

  sendToAll(msg, exclude) {
    exclude = _.isArray(exclude) ? exclude : [exclude];

    // We do this instead of sendToAll() for efficiency
    _.values(this.clients).forEach(client => {
      const { userId } = client;
      if(exclude.includes(userId))
        return;

      client.channel.send(msg);
    });
  }
}

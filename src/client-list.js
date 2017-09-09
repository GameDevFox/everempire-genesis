import _ from 'lodash';

import Events from './common/events';

export default class ClientList {
  constructor() {
    this.commands = {};
    this.clientIdCounter = 0;
    this.clients = {};
  }

  add(client) {
    const cid = ++this.clientIdCounter;
    client.cid = cid;

    client.session.on(Events.MESSAGE, ({ cmd, data }) => {
      const command = this.commands[cmd];

      if(!command) {
        console.warn(`No [${cmd}] command found for cid: ${client.cid}`);
        return;
      }

      command(client, data);
    });

    // TODO: Find a way to modularize all the ping related stuff on the server side
    const pingInterval = setInterval(() => client.ping(), 1000);
    client.session.on(Events.CLOSE, () => {
      clearInterval(pingInterval);

      delete this.clients[client.cid];
      console.log('Client disconnected.');
    });

    this.clients[cid] = client;
  }

  commandAll(cmd, data, exclude) {
    this.sendToAll({ cmd, data }, exclude);
  }

  sendToAll(msg, exclude) {
    exclude = _.isArray(exclude) ? exclude : [exclude];

    // We do this instead of sendToAll() for efficiency
    _.values(this.clients).forEach(client => {
      const { cid } = client;
      if(exclude.includes(cid))
        return;

      client.session.send(msg);
    });
  }
}

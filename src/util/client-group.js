import _ from 'lodash';

export default class ClientGroup {
  constructor() {
    this.clients = [];
    this.handlers = {};
  }

  add(client) {
    _.each(this.handlers, (handler, event) => {
      client.commands.on(event, handler);
    });
    this.clients.push(client);
  }

  remove(client) {
    _.remove(this.clients, e => e === client);
    _.each(this.handlers, (handler, event) => {
      client.commands.removeListener(event, handler);
    });
  }

  on(event, handler) {
    this.clients.forEach(client => {
      client.commands.on(event, handler);
    });
    this.handlers[event] = handler;
  }
}

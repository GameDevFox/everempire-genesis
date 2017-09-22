import EventEmitter from 'events';

import Commands from './common/commands';
import Events from './common/events';
import TimeSync from './common/time-sync';
import randomHex from './util/random-hex';

export default class Client extends EventEmitter {
  constructor(channel) {
    super();
    this.channel = channel;
    this.data = {};

    this.commands = channel.commands;
    this.timeSync = new TimeSync();

    // Initialize ping
    const pingInterval = setInterval(() => this.ping(), 1000);
    this.channel.on(Events.CLOSE, () => clearInterval(pingInterval));
  }

  ping() {
    this.lastPing = [randomHex(), Date.now()];
    this.channel.command(Commands.PING, this.lastPing);
  }

  pong() {
    this.laterLocalTime = Date.now();
    this.channel.command(Commands.PONG, [this.lastPing[0], this.laterLocalTime]);
  }
}

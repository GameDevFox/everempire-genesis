import EventEmitter from 'events';

import Commands from './common/commands';
import TimeSync from './common/time-sync';
import randomHex from './util/random-hex';

export default class Client extends EventEmitter {
  constructor(session) {
    super();
    this.session = session;
    this.data = {};

    this.timeSync = new TimeSync();
    this.commands = session.commands;
  }

  ping() {
    this.lastPing = [randomHex(), Date.now()];
    this.session.command(Commands.PING, this.lastPing);
  }

  pong() {
    this.laterLocalTime = Date.now();
    this.session.command(Commands.PONG, [this.lastPing[0], this.laterLocalTime]);
  }
}

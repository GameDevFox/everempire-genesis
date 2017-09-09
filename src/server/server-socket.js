import EventEmitter from 'events';

import Events from '../common/events';

export default class ServerSocket extends EventEmitter {
  constructor(ws) {
    super();
    this.ws = ws;

    this.ws.on('message', msg => this.onMessage(msg));
    this.ws.on('close', e => this.onClose(e));
  }

  send(msg) {
    this.ws.send(msg);
  }

  onMessage(msg) {
    this.emit(Events.MESSAGE, msg);
  }

  onClose(e) {
    this.emit(Events.CLOSE, e);
  }
}

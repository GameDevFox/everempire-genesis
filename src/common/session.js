import _ from 'lodash';
import EventEmitter from 'events';

import Events from '../common/events';

export default class Session extends EventEmitter {
  constructor(socket, options = {}) {
    super();
    this.socket = socket;
    this.options = options;

    this.requestIdCount = 0;
    this.requestHooks = {};

    this.socket.on(Events.MESSAGE, msg => this.onMessage(msg));
    this.socket.on(Events.CLOSE, () => this.emit(Events.CLOSE));

    this.commands = new EventEmitter();
  }

  command(cmd, data, options = {}) {
    const msg = data ? { cmd, data } : { cmd };
    return this.send(msg, options);
  }

  send(msg, options = {}) {
    let result;

    if(options.request) {
      const requestId = ++this.requestIdCount;
      msg.requestId = requestId;
      result = new Promise((resolve, reject) => {
        this.requestHooks[requestId] = { resolve, reject };
      });
    }

    const msgStr = JSON.stringify(msg);
    this.socket.send(msgStr);

    return result;
  }

  // Event Handlers
  onMessage(msgStr) {
    const msg = JSON.parse(msgStr);

    // Optionally trace messages
    this.handleTrace(msg);

    // Handle a request
    const requestId = msg.requestId;
    if(requestId) {
      delete msg.requestId;
      msg.respond = (msgToSend, options = {}) => {
        msgToSend.responseId = requestId;
        return this.send(msgToSend, options);
      };
    }

    // Handle a response
    const responseId = msg.responseId;
    if(responseId) {
      this.requestHooks[responseId].resolve(msg);
    }

    // Dispatch event
    this.emit(Events.MESSAGE, msg);

    // Emit command event if there's a command
    const { cmd } = msg;
    if(cmd)
      this.commands.emit(cmd, msg);
  }

  handleTrace(msg) {
    const { trace } = this.options;
    if(!trace)
      return;

    let show = _.isBoolean(trace) ? trace : false;
    if(_.isArray(trace) && trace.includes(msg.cmd))
      show = true;
    if(_.isFunction(trace) && trace(msg))
      show = true;

    if(show)
      console.log('Genesis Trace:', JSON.stringify(msg, null, 2));
  }
}

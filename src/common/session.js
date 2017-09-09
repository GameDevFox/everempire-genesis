import _ from 'lodash';
import EventEmitter from 'events';

import Events from '../common/events';

// TODOS: Make this a channel so that you can sub sub-sub-sub channels
export default function Session(socket, options = {}) {
  const { trace, acceptChannels } = options;

  const result = new EventEmitter();
  const commands = new EventEmitter();

  let requestIdCount = 0;

  const channels = {};
  const requestHooks = {};

  const send = (msg, options = {}) => {
    let result;

    if(options.request) {
      const requestId = ++requestIdCount;
      msg.requestId = requestId;
      result = new Promise((resolve, reject) => {
        requestHooks[requestId] = { resolve, reject };
      });
    }

    const msgStr = JSON.stringify(msg);
    socket.send(msgStr);

    return result;
  };

  const command = (cmd, data, options = {}) => {
    const msg = data ? { cmd, data } : { cmd };
    return send(msg, options);
  };

  const handleTrace = msg => {
    if(!trace)
      return;

    let show = _.isBoolean(trace) ? trace : false;
    if(_.isArray(trace) && trace.includes(msg.cmd))
      show = true;
    if(_.isFunction(trace) && trace(msg))
      show = true;

    if(show)
      console.log('Genesis Trace:', JSON.stringify(msg, null, 2));
  };

  const onMessage = msgStr => {
    const msg = JSON.parse(msgStr);

    // Optionally trace messages
    handleTrace(msg);

    // Handle a request
    const { requestId } = msg;
    if(requestId) {
      delete msg.requestId;
      msg.respond = (msgToSend, options = {}) => {
        msgToSend.responseId = requestId;
        return send(msgToSend, options);
      };
    }

    // Handle a response
    const { responseId } = msg;
    if(responseId) {
      requestHooks[responseId].resolve(msg);
    }

    // Handle a channel
    const { channelId } = msg;
    if(channelId && acceptChannels) {
      let channel = channels[channelId];

      if(channel) {
        // Dispatch message to channel
        const subMsg = msg.msg;
        channel.emit(Events.MESSAGE, subMsg);
      } else {
        // Create channel if it doesn't exist
        channel = new EventEmitter();
        channels[channelId] = channel;

        result.emit(Events.CHANNEL, channel);
      }
    }

    // Dispatch event
    result.emit(Events.MESSAGE, msg);

    // Emit command event if there's a command
    const { cmd } = msg;
    if(cmd)
      commands.emit(cmd, msg);
  };

  socket.on(Events.MESSAGE, onMessage);
  socket.on(Events.CLOSE, () => result.emit(Events.CLOSE));

  return _.merge(result, {
    command,
    commands,
    send
  });
}

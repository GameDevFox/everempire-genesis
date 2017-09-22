import _ from 'lodash';
import EventEmitter from 'events';

import Events from '../common/events';

import DeltaView from './delta-view';

export default function Channel(sendFn, channelOptions = {}) {
  const { trace, acceptChannels, acceptViews } = channelOptions;

  const result = new EventEmitter();
  const commands = new EventEmitter();

  let requestCounter = 0;
  const requestHooks = {};

  let channelCounter = 0;
  const channels = {};
  const remoteChannels = {};

  let viewCounter = 0;
  const remoteViews = {};

  const send = (msg, options = {}) => {
    let result;

    if(options.request) {
      const requestId = ++requestCounter;
      msg.requestId = requestId;
      result = new Promise((resolve, reject) => {
        requestHooks[requestId] = { resolve, reject };
      });
    }

    const { channelId } = channelOptions;
    if(channelId)
      msg = { channelId, msg };

    const { remoteChannelId } = channelOptions;
    if(remoteChannelId)
      msg = { remoteChannelId, msg };

    // console.log('SEND', channelOptions, msg);

    sendFn(msg);

    return result;
  };

  const command = (cmd, data, options = {}) => {
    const msg = data ? { cmd, data } : { cmd };
    return send(msg, options);
  };

  const buildChannel = (channelId, options) => {
    let finalOptions = {};

    if(channelId)
      finalOptions = _.merge(options, { remoteChannelId: channelId });
    else
      finalOptions = _.merge(options, { channelId: ++channelCounter });

    return new Channel(send, finalOptions);
  };

  const channel = (options, callback) => {
    const channel = buildChannel(null, options);

    // Fire callback to allow adding event listeners before setup finalized
    if(callback)
      callback(channel);

    const channelId = channel.channelId();
    channels[channelId] = channel;

    send({ channelId });

    return channel;
  };

  const view = () => {
    const view = DeltaView();

    const viewId = ++viewCounter;

    view.on('enter', enterData => send({ viewId, enter: enterData }));
    view.on('exit', paths => send({ viewId, exit: paths }));

    // Send message to create view remotely
    send({ viewId });

    return view;
  };

  const channelId = () => channelOptions.channelId || channelOptions.remoteChannelId;

  const _handleTrace = msg => {
    let show = _.isBoolean(trace) ? trace : false;
    if(_.isArray(trace) && trace.includes(msg.cmd))
      show = true;
    if(_.isFunction(trace) && trace(msg))
      show = true;

    if(show)
      console.log('Genesis Trace:', JSON.stringify(msg, null, 2));
  };

  // TODOS: Consider renaming
  const onMessage = msg => {
    // Optionally trace messages
    if(trace)
      _handleTrace(msg);

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
    // ... remote source
    const { channelId } = msg;
    if(channelId && acceptChannels) {
      let channel = remoteChannels[channelId];

      if(channel) {
        // Dispatch message to channel
        const subMsg = msg.msg;
        channel.onMessage(subMsg);
      } else {
        // Create channel if it doesn't exist
        channel = buildChannel(channelId);
        remoteChannels[channelId] = channel;

        result.emit(Events.CHANNEL, channel);
      }
    }

    // ... local source
    const { remoteChannelId } = msg;
    if(remoteChannelId) {
      const channel = channels[remoteChannelId];

      // Dispatch message
      const subMsg = msg.msg;
      channel.onMessage(subMsg);
    }

    // Handle a view update
    const { viewId } = msg;
    if(viewId && acceptViews) {
      let view = remoteViews[viewId];

      if(view) {
        // Process update
        const { enter: enterData, exit: paths } = msg;

        if(enterData)
          view.enter(enterData);

        if(paths)
          view.exit(paths);
      } else {
        // Create view if it doesn't exist
        view = DeltaView();
        remoteViews[viewId] = view;

        result.emit(Events.VIEW, view);
      }
    }

    // Dispatch event
    result.emit(Events.MESSAGE, msg);

    // Emit command event if there's a command
    const { cmd } = msg;
    if(cmd)
      commands.emit(cmd, msg);
  };

  return _.merge(result, {
    channel,
    channelId,
    command,
    commands,
    onMessage,
    send,
    view
  });
}

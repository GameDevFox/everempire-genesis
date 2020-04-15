import Events from '../common/events';

export default function ServerSocket(ws) {
  const sendToSocket = msg => {
    const msgStr = JSON.stringify(msg);
    ws.send(msgStr);
  };

  const sendToChannel = channel => {
    const onMessage = msgStr => {
      const msg = JSON.parse(msgStr);
      channel.onMessage(msg);
    };

    const onClose = () => channel.emit(Events.CLOSE);

    ws.on(Events.MESSAGE, onMessage);
    ws.on(Events.CLOSE, onClose);
  };

  return {
    sendToSocket,
    sendToChannel,
  };
}

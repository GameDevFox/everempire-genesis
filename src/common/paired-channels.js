import Channel from './channel';

export default function PairedChannels(aOptions, bOptions) {
  const a = {};
  const b = {};

  const sendToA = msg => {
    a.channel.onMessage(msg);
  };

  const sendToB = msg => {
    b.channel.onMessage(msg);
  };

  a.channel = Channel(sendToB, aOptions);
  b.channel = Channel(sendToA, bOptions);

  return [a.channel, b.channel];
}

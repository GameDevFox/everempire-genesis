import 'should';
import sinon from 'sinon';

import Events from '../common/events';

import Channel from './channel';
import PairedChannels from './paired-channels';

/* eslint-disable */
Array.prototype.includes = function(element) {
  return this.indexOf(element) !== -1;
};
/* eslint-enabled */

// TODOS: Move this into a common testing library for reuse
const withSpy = (obj, prop, callback) => {
  const spy = sinon.spy();

  const saved = obj[prop];
  obj[prop] = spy;

  try {
    callback(spy);
  } finally {
    obj[prop] = saved;
  }
};

let serverChannel;
let clientChannel;

const Counter = (countTo, callback) => {
  let count = 0;
  return () => {
    if(++count >= countTo)
      callback();
  };
};

describe('Channel', () => {
  beforeEach(() => {
    [serverChannel, clientChannel] = PairedChannels();
  });

  it('should be able to send and receieve messages', done => {
    const counter = Counter(2, done);

    serverChannel.on(Events.MESSAGE, msg => {
      msg.ping.should.equal(908);
      counter();
    });

    clientChannel.on(Events.MESSAGE, msg => {
      msg.test.should.equal('text');
      counter();
    });

    serverChannel.send({ test: 'text' });
    clientChannel.send({ ping: 908 });

  });

  it('should be able to send and respond to requests', () => {
    return new Promise((resolve, reject) => {
      serverChannel.commands.on('test-msg', msg => {
        let { number } = msg.data;
        number *= 2;
        msg.respond({ number }, { request: true }).then(msg => {
          msg.number.should.equal(36);
          resolve();
        }).catch(reject);
      });

      clientChannel.command('test-msg', { number: 13 }, { request: true }).then(msg => {
        let { number } = msg;
        msg.number.should.equal(26);

        number += 10;
        msg.respond({ number });
      }).catch(reject);
    });
  });

  it('should send all messages with channelId', () => {
    const spy = sinon.spy();

    const channel = Channel(spy, { channelId: 123 });
    channel.channelId().should.equal(123);

    channel.send({ something: 'more' });
    spy.firstCall.args[0].should.eql({ channelId: 123, msg: { something: 'more' } });
  });

  it('should send all messages with remoteChannelId', () => {
    const spy = sinon.spy();

    const channel = Channel(spy, { remoteChannelId: 456 });
    channel.channelId().should.equal(456);

    channel.send({ another: 'one' });
    spy.firstCall.args[0].should.eql({ remoteChannelId: 456, msg: { another: 'one' } });
  });

  describe('command(cmd, data)', () => {
    it('should send a json message through the Socket', () => {
      const spy = sinon.spy();
      clientChannel.on(Events.MESSAGE, spy);

      serverChannel.command('test', { one: 'two', three: 'four' });
      spy.firstCall.args[0].should.eql({cmd: 'test', data: { one: 'two', three: 'four' } });
    });

    it('should omit data if not included', () => {
      const spy = sinon.spy();
      clientChannel.on(Events.MESSAGE, spy);

      serverChannel.command('another-one');
      spy.firstCall.args[0].should.eql({ cmd: 'another-one' });
    });
  });
});

describe('Channel', () => {
  beforeEach(() => {
    [serverChannel, clientChannel] = PairedChannels({}, { trace: true });
  });

  describe('Channel(sendFn, { trace: true })', () => {
    it('should trace all messages', () => {
      withSpy(console, 'log', spy => {
        serverChannel.send({hello: 'world'});
        spy.firstCall.args.should.eql(['Genesis Trace:', '{\n  "hello": "world"\n}']);
      });
    });
  });
});

describe('Channel', () => {
  beforeEach(() => {
    [serverChannel, clientChannel] = PairedChannels({}, { trace: ['cmd1', 'cmd3'] });
  });

  describe('Channel(sendFn, { trace: [\'cmd1\', \'cmd3\'] })', () => {
    it('should trace messages with given commands', () => {
      withSpy(console, 'log', spy => {
        serverChannel.send({ cmd: 'cmd0' });
        spy.callCount.should.equal(0);

        serverChannel.send({ cmd: 'cmd1' });
        spy.callCount.should.equal(1);

        serverChannel.send({ cmd: 'cmd2' });
        spy.callCount.should.equal(1);

        serverChannel.send({ cmd: 'cmd3' });
        spy.callCount.should.equal(2);
      });
    });
  });
});

describe('Channel', () => {
  beforeEach(() => {
    const clientOptions = {
      trace: msg => {
        return msg.number && msg.number > 10;
      }
    };

    [serverChannel, clientChannel] = PairedChannels({}, clientOptions);
  });

  describe('Channel(sendFn, { trace: msg => { ... } })', () => {
    it('should trace messages that pass the filter', () => {
      withSpy(console, 'log', spy => {
        serverChannel.send({ something: 'else' });
        spy.callCount.should.equal(0);

        serverChannel.send({ number: 100 });
        spy.callCount.should.equal(1);

        serverChannel.send({ number: 5 });
        spy.callCount.should.equal(1);
      });
    });
  });
});

describe('Channel', () => {
  beforeEach(() => {
    [serverChannel, clientChannel] = PairedChannels({}, { acceptChannels: true });
  });

  describe('Channel(sendFn, { acceptChannels: true })', () => {
    it('should create channels', () => {
      const spy = sinon.spy();
      clientChannel.on(Events.CHANNEL, spy);

      serverChannel.channel();
      spy.called.should.be.true();
    });

    it('should send and accept messages and commands on the channel', () => {
      return new Promise(resolve => {
        const counter = Counter(2, resolve);

        clientChannel.on(Events.CHANNEL, channel => {
          channel.on(Events.MESSAGE, msg => {
            msg.should.eql({channelTest: 'works'});
            counter()
          });

          channel.command('test-cmd', { channelCommand: 'yes' });
        });

        const channel = serverChannel.channel(null, channel => {
          channel.commands.on('test-cmd', msg => {
            msg.should.eql({ cmd: 'test-cmd', data: { channelCommand: 'yes' } });
            counter()
          });
        });

        channel.send({ channelTest: 'works' });
      });
    });
  });
});

describe('Channel', () => {
  describe('Channel(sendFn, { acceptChannels: false })', () => {
    beforeEach(() => {
      [serverChannel, clientChannel] = PairedChannels({}, { acceptChannels: false });
    });

    it('should not accept channels', () => {
      const spy = sinon.spy();
      clientChannel.on(Events.CHANNEL, spy);

      serverChannel.channel();
      spy.called.should.be.false();
    });
  });
});

describe('Channel', () => {
  describe('Channel(sendFn, { acceptViews: true })', () => {
    it('should work', () => {
      [serverChannel, clientChannel] = PairedChannels({}, { acceptViews: true });

      const enterSpy = sinon.spy();
      const exitSpy = sinon.spy();

      const viewP = new Promise(resolve => {
        clientChannel.on(Events.VIEW, view => {
          view.on('enter', enterSpy);
          view.on('exit', exitSpy);

          resolve(view);
        });
      });

      const view = serverChannel.view();
      view.enter({
        hello: 'test',
        goodbye: 'bugs'
      });
      view.enter({
        hello: 'world',
        player: {
          name: 'Alex',
          gold: 2000
        }
      });
      view.exit(['goodbye']);
      view.enter({
        player: {
          gold: 3000,
          hp: 100
        }
      });
      view.exit([{
        player: ['name']
      }]);

      return viewP.then(view => {
        enterSpy.callCount.should.equal(3);
        exitSpy.callCount.should.equal(2);

        view.data.should.eql({
          hello: 'world',
          player: {
            gold: 3000,
            hp: 100
          }
        });
      });
    });
  });
});

import EventEmitter from 'events';
import should from 'should';
import sinon from 'sinon';

import Events from '../common/events';
import Session from './session';

/* eslint-disable */
Array.prototype.includes = function(element) {
  return this.indexOf(element) != -1;
};
/* eslint-enable */

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

let socket;
let session;

const socketMsg = msg => {
  socket.emit(Events.MESSAGE, JSON.stringify(msg));
};

describe('Session', () => {
  beforeEach(() => {
    socket = new EventEmitter();
    socket.send = sinon.stub();

    session = new Session(socket);
  });

  it('should pass through CLOSE event', () => {
    return new Promise(resolve => {
      session.on(Events.CLOSE, () => {
        resolve();
      });

      socket.emit(Events.CLOSE);
    });
  });

  describe('Session(socket, { trace: true })', () => {
    it('should trace all messages', () => {
      session = new Session(socket, { trace: true });

      withSpy(console, 'log', spy => {
        socketMsg({ hello: 'world' });
        spy.firstCall.args.should.eql(['Genesis Trace:', '{\n  "hello": "world"\n}']);
      });
    });
  });

  describe('Session(socket, { trace: [\'cmd1\', \'cmd3\'] })', () => {
    it('should trace no messages', () => {
      session = new Session(socket, { trace: ['cmd1', 'cmd3'] });

      withSpy(console, 'log', spy => {
        socketMsg({ cmd: 'cmd0' });
        spy.callCount.should.equal(0);

        socketMsg({ cmd: 'cmd1' });
        spy.callCount.should.equal(1);

        socketMsg({ cmd: 'cmd2' });
        spy.callCount.should.equal(1);

        socketMsg({ cmd: 'cmd3' });
        spy.callCount.should.equal(2);
      });
    });
  });

  describe('Session(socket, { trace: msg => { ... } })', () => {
    it('should trace no messages', () => {
      session = new Session(socket, {
        trace: msg => {
          return msg.number && msg.number > 10;
        }
      });

      withSpy(console, 'log', spy => {
        socketMsg({ something: 'else' });
        spy.callCount.should.equal(0);

        socketMsg({ number: 100 });
        spy.callCount.should.equal(1);

        socketMsg({ number: 5 });
        spy.callCount.should.equal(1);
      });
    });
  });

  describe('Session(socket, { acceptChannels: true })', () => {
    beforeEach(() => {
      session = new Session(socket, { acceptChannels: true });
    });

    it('should create channels', () => {
      const spy = sinon.spy();
      session.on(Events.CHANNEL, spy);

      socketMsg({ channelId: 308 });

      spy.called.should.be.true();
    });

    it('should accept messages on the channel', () => {
      return new Promise(resolve => {
        session.on(Events.CHANNEL, channel => {
          channel.on(Events.MESSAGE, msg => {
            msg.should.eql({ channelTest: 'works' });
            resolve();
          });
        });

        socketMsg({ channelId: 647 });
        socketMsg({ channelId: 647, msg: { channelTest: 'works' } });
      });
    });
  });

  describe('Session(socket, { acceptChannels: false })', () => {
    beforeEach(() => {
      session = new Session(socket, { acceptChannels: false });
    });

    it('should not accept channels', () => {
      const spy = sinon.spy();
      session.on(Events.CHANNEL, spy);

      socketMsg({ channelId: 308 });

      spy.called.should.be.false();
    });
  });

  describe('command(cmd, data)', () => {
    it('should send a json message through the Socket', () => {
      session.command('test', { one: 'two', three: 'four' });
      socket.send.firstCall.args[0].should.equal('{"cmd":"test","data":{"one":"two","three":"four"}}');
    });

    it('should omit data if not included', () => {
      session.command('another-one');
      socket.send.firstCall.args[0].should.equal('{"cmd":"another-one"}');
    });
  });

  describe('send(msg, options = {})', () => {
    it('should return a promise if message is a request', () => {
      socket.send.callsFake(msgStr => {
        const msg = JSON.parse(msgStr);
        const requestId = msg.requestId;

        socketMsg({
          cmd: 'test-response',
          data: 'Hello World',
          responseId: requestId
        });
      });

      const reqP = session.send({ cmd: 'test' }, { request: true });
      return reqP.then(res => {
        res.should.deepEqual({
          cmd: 'test-response',
          data: 'Hello World',
          responseId: 1
        });
      });
    });
  });

  describe('onMessage(msgStr)', () => {
    it('should add a respond method for requests that sends a msg with a responseId', () => {
      return new Promise(resolve => {
        const requestId = 762;

        session.on(Events.MESSAGE, msg => {
          should(msg.respond).not.be.undefined();

          msg.respond({ data: 321 });
          socket.send.firstCall.args[0].should.be.eql(JSON.stringify({ data: 321, responseId: requestId }));

          resolve();
        });

        socketMsg({ requestId });
      });
    });
  });
});

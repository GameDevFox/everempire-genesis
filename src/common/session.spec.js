import EventEmitter from 'events';
import should from 'should';
import sinon from 'sinon';

import Events from '../common/events';
import Session from './session';

describe('Session', () => {
  let socket;
  let session;

  beforeEach(() => {
    socket = new EventEmitter();
    socket.send = sinon.stub();

    session = new Session(socket);
  });

  it('should pass through CLOSE event', () => {
    const p = new Promise(resolve => {
      session.on(Events.CLOSE, () => {
        resolve();
      });
    });

    socket.emit(Events.CLOSE);

    return p;
  });

  describe('Session(session, { trace: true })', () => {
    it('should trace all messages', () => {
      session = new Session(socket, { trace: true });

      const old = console.log;
      console.log = sinon.spy();

      socket.emit(Events.MESSAGE, JSON.stringify({ hello: 'world' }));
      console.log.firstCall.args.should.eql(['Genesis Trace:', '{\n  "hello": "world"\n}']);

      console.log = old;
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

        const outMsg = JSON.stringify({
          cmd: 'test-response',
          data: 'Hello World',
          responseId: requestId
        });
        socket.emit(Events.MESSAGE, outMsg);
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
      const requestId = 762;

      const p = new Promise(resolve => {
        session.on(Events.MESSAGE, msg => {
          should(msg.respond).not.be.undefined();

          msg.respond({ data: 321 });
          socket.send.firstCall.args[0].should.be.eql(JSON.stringify({ data: 321, responseId: requestId }));

          resolve();
        });
      });

      socket.emit(Events.MESSAGE, JSON.stringify({ requestId }));

      return p;
    });
  });
});

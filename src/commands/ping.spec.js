import sinon from 'sinon';

import ping from './ping'

describe('ping(session, data)', () => {
  it('should work', () => {
    const session = {
      commandAll: sinon.spy(),
      lastPing: []
    };

    ping(session, [0, 0])
  });
});

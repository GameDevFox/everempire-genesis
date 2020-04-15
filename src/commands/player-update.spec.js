import sinon from 'sinon';

import buildPlayerUpdate from './player-update';

describe('playerUpdate(session, vectorPath)', () => {
  let playerUpdate;
  before(() => {
    const clientList = {
      commandAll: sinon.spy(),
    };
    playerUpdate = buildPlayerUpdate(clientList);
  });

  it('should work', () => {
    const session = { data: {} };
    playerUpdate(session, {});
  });
});

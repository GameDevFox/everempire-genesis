import sinon from 'sinon';

import buildPlayerUpdate from './player-update'

let playerUpdate;

describe('playerUpdate(session, vectorPath)', () => {

    before(() => {
        const sessionList = {
            sendCmd: sinon.spy()
        };

        playerUpdate = buildPlayerUpdate(sessionList);
    });

    it('should work', () => {
        const session = {
            data: {},
        };

        playerUpdate(session, {})
    });
});

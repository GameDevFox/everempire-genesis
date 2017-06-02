import sinon from 'sinon';

import ping from './ping'

describe('ping(session, args)', () => {
    it('should work', () => {
        const session = {
            sendCmd: sinon.spy(),
            lastPing: []
        };

        ping(session, [0, 0])
    });
});

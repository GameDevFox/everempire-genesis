import should from 'should';

import EventEmitter from 'events';
import sinon, {assert} from 'sinon';

import EventGroup from './event-group'

const EVENT_A = 'event_a';
const EVENT_B = 'event_b';

describe('EventGroup', () => {
    it('should work', () => {
        // Setup
        const eventGroup = new EventGroup();

        const spyA = sinon.spy();
        eventGroup.on(EVENT_A, spyA);

        const symbolA = new EventEmitter();

        // Test
        const arg = 'arg';
        eventGroup.add(symbolA);
        symbolA.emit(EVENT_A, arg);

        // Assert
        assert.calledOn(spyA.getCall(0), symbolA);
        assert.calledWith(spyA.getCall(0), arg);

        // Test
        const spyB = sinon.spy();
        eventGroup.on(EVENT_B, spyB);

        const symbolB = new EventEmitter();
        eventGroup.add(symbolB);

        const moreArgs = ['more', 'args'];
        symbolA.emit(EVENT_B, moreArgs);
        symbolB.emit(EVENT_A, moreArgs);

        // Assert
        assert.calledOn(spyA.getCall(1), symbolB);
        assert.calledWith(spyA.getCall(1), moreArgs);
        assert.calledOn(spyB.getCall(0), symbolA);
        assert.calledWith(spyB.getCall(0), moreArgs);

        // Test
        eventGroup.remove(symbolA);

        const lastArgs = {last: 'one'};
        symbolA.emit(EVENT_B, lastArgs);
        symbolB.emit(EVENT_B, lastArgs);

        // Assert
        assert.calledOn(spyB.getCall(1), symbolB);
        assert.calledWith(spyB.getCall(1), lastArgs);
        should(spyB.getCall(2)).be.null();
    });
});

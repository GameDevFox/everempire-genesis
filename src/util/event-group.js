import _ from 'lodash';

export default class EventGroup {
    constructor() {
        this.emitters = [];
        this.handlers = {};
    }

    add(emitter) {
        _.each(this.handlers, (handler, event) => {
            emitter.on(event, handler);
        });
        this.emitters.push(emitter);
    }

    remove(emitter) {
        _.remove(this.emitters, e => e === emitter);
        _.each(this.handlers, (handler, event) => {
            emitter.removeListener(event, handler);
        });
    }

    on(event, handler) {
        this.emitters.forEach(emitter => {
           emitter.on(event, handler);
        });
        this.handlers[event] = handler;
    }
}

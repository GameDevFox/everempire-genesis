import EventEmitter from 'events';

import Commands from './common/commands';
import TimeSync from './common/time-sync';

import {randomHex} from './util';

export default class Session extends EventEmitter {
    constructor(ws) {
        super();

        this.ws = ws;

        this.timeSync = new TimeSync();
        this.data = {};

        ws.on('message', msg => {
            const {cmd, args} = JSON.parse(msg);
            this.emit('command', cmd, args);
            this.emit(cmd, args);
        });
    }

    sendPing() {
        const id = randomHex();

        this.lastPing = [id, Date.now()];
        this.sendCmd(Commands.PING, this.lastPing);
    }

    sendCmd(cmd, args) {
        const data = {cmd, args};
        this.send(data);
    }

    send(data) {
        let msg;
        try {
            msg = JSON.stringify(data);
        } catch (e) {
            console.error(e, data);
        }
        this.sendText(msg);
    }

    sendText(text) {
        try {
            this.ws.send(text)
        } catch (e) {
            console.log('It broke', text);
            console.log(e.stack);
        }
    }
}

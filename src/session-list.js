import _ from 'lodash';

import Events from './events';

export default class SesssionList {
    constructor() {
        this.commands = {};
        this.sessionIdCounter = 0;
        this.sessions = {};
    }

    add(session) {
        const sid = ++this.sessionIdCounter;
        session.sid = sid;
        session.conected = true;

        session.on(Events.COMMAND, (cmd, args) => {
            const command = this.commands[cmd];

            if(!command) {
                console.warn(`No [${cmd}] command found for sid: ${session.sid}`);
                return;
            }

            command(session, args);
        });

        // TODO: Find a way to modularize all the ping related stuff on the server side
        const pingInterval = setInterval(() => session.sendPing(), 1000);
        session.ws.on('close', () => {
            session.connected = false;

            clearInterval(pingInterval);

            delete this.sessions[session.sid];
            console.log('Client disconnected.');
        });

        // sendInitialData(session)

        this.sessions[sid] = session;
    }

    // sendInitialData(session) {
    //     const allUserData = _.values(this.sessions).map(session => session.data);
    //     sendJsonToAll(allUserData);
    // }

    sendCmd(cmd, args, exclude) {
        this.send({cmd, args}, exclude);
    }

    send(data, exclude) {
        exclude = _.isArray(exclude) ? exclude : [exclude];

        // We do this instead of send() for efficiency
        const json = JSON.stringify(data);
        _.values(this.sessions).map(session => {
            const {sid} = session;
            if(exclude.includes(sid))
                return;

            session.sendText(json);
        });
    }
};

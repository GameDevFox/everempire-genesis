// import _ from 'lodash';

import Commands from './common/commands';

export default function buildCommands(sessionList) {
    const commands = {};

    commands[Commands.AUTH] = () => {};

    commands[Commands.PING] = (session, args) => {
        const laterLocalTime = Date.now();

        // Send Pong
        session.sendCmd(Commands.PONG, [session.lastPing[0], laterLocalTime]);

        // Validate id
        const {lastPing} = session;
        const [id, localTime] = lastPing;
        const [receivedId, clientTime] = args;

        if(id !== receivedId) {
            console.warn(`Ping ids did not match, ignoring: ${id} ${receivedId}`);
            return;
        }

        // Calculate Ping
        session.ping = laterLocalTime - localTime;

        // Calculate Sync
        session.timeSync.update(localTime, clientTime, laterLocalTime);
    };

    commands[Commands.PLAYER_UPDATE] = (session, vectorPath) => {
        // Update player data and send to others
        session.data.vectorPath = vectorPath;

        const {sid} = session;
        sessionList.sendCmd(Commands.PLAYER_UPDATE, {sid, vectorPath}, sid);
    };

    // commands['set'] = (session, args) => {
    //     const {data} = session;
    //     _.assign(data, args);
    //
    //     sessionList.send(data);
    // };

    return commands;
}

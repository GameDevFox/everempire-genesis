import Commands from '../common/commands';

export default function(session, args) {
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
}

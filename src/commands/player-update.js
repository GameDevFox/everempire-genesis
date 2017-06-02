import Commands from '../common/commands';

export default function build(sessionList) {
   return (session, vectorPath) => {
        // Update player data and send to others
        session.data.vectorPath = vectorPath;

        const {sid} = session;
        sessionList.sendCmd(Commands.PLAYER_UPDATE, {sid, vectorPath}, sid);
    }
}

import Commands from '../common/commands';

export default function build(clientList) {
  return (client, vectorPath) => {
    // Update player data and sendToAll to others
    client.data.vectorPath = vectorPath;

    const { userId } = client;
    clientList.commandAll(Commands.PLAYER_UPDATE, { userId, vectorPath }, userId);
  };
}

export default function(client, data) {
  // Send Pong
  client.pong();

  // Validate id
  const { lastPing } = client;
  const [id, localTime] = lastPing;
  const [receivedId, clientTime] = data;

  // Ignore is ids don't match
  if(id !== receivedId) {
    console.warn(`Ping ids did not match, ignoring: ${id} ${receivedId}`);
    return;
  }

  // Calculate Ping & Sync
  client.pingTime = client.laterLocalTime - localTime;
  client.timeSync.update(localTime, clientTime, client.laterLocalTime);
}

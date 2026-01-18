import * as signalR from '@microsoft/signalr';
import type { Message } from '../../types/Message';

let connection: signalR.HubConnection | null = null;

export async function startSignalR(token: string | null, onMessage: (m: Message) => void) {
  if (connection) return connection;
  connection = new signalR.HubConnectionBuilder()
    .withUrl((import.meta.env.VITE_SIGNALR_URL || 'https://localhost:7199') + '/hubs/messages', {
      accessTokenFactory: () => token || '',
    })
    .withAutomaticReconnect()
    .build();

  connection.on('ReceiveMessage', (message: Message) => {
    onMessage(message);
  });

  connection.onclose(e => {
    console.warn('SignalR closed', e);
  });

  await connection.start();
  console.log('SignalR connected');
  return connection;
}

export async function stopSignalR() {
  if (!connection) return;
  await connection.stop();
  connection = null;
}

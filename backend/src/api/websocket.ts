import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientId = req.headers['sec-websocket-key'] || Math.random().toString(36);
      this.clients.set(clientId, ws);

      console.log(`WebSocket client connected: ${clientId}`);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(clientId, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          event: 'connected',
          payload: { clientId, timestamp: Date.now() },
        })
      );
    });

    console.log('WebSocket server initialized');
  }

  private handleMessage(clientId: string, data: any) {
    // Handle client messages (subscribe/unsubscribe to events)
    if (data.type === 'subscribe') {
      // Store subscription preferences
      console.log(`Client ${clientId} subscribed to: ${data.events.join(', ')}`);
    }
  }

  broadcast(event: string, payload: any) {
    const message = JSON.stringify({ event, payload });
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  sendToClient(clientId: string, event: string, payload: any) {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, payload }));
    }
  }

  close() {
    this.wss?.close();
    this.clients.clear();
  }
}

export default new WebSocketManager();


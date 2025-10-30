import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ConsultationGateway {
  @WebSocketServer()
  server: Server;

  // 🔥 Send event to all connected clients
  sendQueueStatusUpdate(consultationId: number, queueStatus: string) {
    this.server.emit('queueStatusUpdate', { consultationId, queueStatus });
  }
}

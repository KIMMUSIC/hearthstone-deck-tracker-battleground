import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface MmrUpdatePayload {
  mmr: number;
  matchId: string;
  placement: number;
  heroCardId: string;
}

@WebSocketGateway({
  namespace: '/ws/live-mmr',
  cors: { origin: '*' },
})
export class MmrGateway {
  private readonly logger = new Logger(MmrGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleTag: string },
  ) {
    const room = `mmr:${data.battleTag}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    return { event: 'subscribed', data: { battleTag: data.battleTag } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleTag: string },
  ) {
    const room = `mmr:${data.battleTag}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  broadcastMmrUpdate(battleTag: string, payload: MmrUpdatePayload) {
    const room = `mmr:${battleTag}`;
    this.server.to(room).emit('mmr:update', {
      battleTag,
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`MMR update broadcast to ${room}: ${payload.mmr}`);
  }
}

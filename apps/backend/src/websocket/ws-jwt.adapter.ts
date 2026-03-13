import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServerOptions } from 'socket.io';

export class WsJwtAdapter extends IoAdapter {
  private readonly logger = new Logger(WsJwtAdapter.name);
  private jwtService: JwtService;

  constructor(app: INestApplicationContext) {
    super(app);
    this.jwtService = app.get(JwtService);
  }

  createIOServer(port: number, options?: Partial<ServerOptions>) {
    const server = super.createIOServer(port, options);

    server.use(async (socket: any, next: (err?: Error) => void) => {
      const token = socket.handshake?.auth?.token;
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token);
          socket.data.userId = payload.sub;
        } catch {
          this.logger.warn(`WebSocket auth failed for ${socket.id}`);
        }
      }
      // Allow connection even without auth (public subscriptions)
      next();
    });

    return server;
  }
}

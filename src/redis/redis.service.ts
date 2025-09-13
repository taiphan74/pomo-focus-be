import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import type { Redis as IORedisClient, RedisOptions } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private clients: Record<string, IORedisClient> = {};

  constructor(private readonly config: ConfigService) {}

  createClient(name: string, opts?: RedisOptions | string): IORedisClient {
    const isProd = (process.env.NODE_ENV || 'development') === 'production';

    const defaultOpts = () => {
      const url = this.config.get<string>('REDIS_URL') || '';
      if (url) return url;
      return {
        host: this.config.get<string>('REDIS_HEAD', this.config.get<string>('REDIS_HOST', '127.0.0.1')),
        port: parseInt(this.config.get<string>('REDIS_PORT', '6379'), 10),
        password: this.config.get<string>('REDIS_PASSWORD') || undefined,
        db: parseInt(this.config.get<string>('REDIS_DB', '0'), 10),
      } as RedisOptions | string;
    };

    const options = opts ?? defaultOpts();

    // lazyConnect: in development we prefer lazy to avoid blocking startup
    // in production try to connect immediately (fast)
    const lazyConnect = !isProd;

    const client = typeof options === 'string'
      ? new Redis(options, { lazyConnect })
      : new Redis({ ...(options as RedisOptions), lazyConnect });

    client.on('error', (err) => this.logger.error(`Redis[${name}] error: ${err.message}`, err.stack));
    client.on('connect', () => this.logger.log(`Redis[${name}] connecting`));
    client.on('ready', () => this.logger.log(`Redis[${name}] ready`));
    client.on('end', () => this.logger.log(`Redis[${name}] connection ended`));

    // If production and not lazy, attempt to connect now
    if (!lazyConnect) {
      client.connect().catch((err) => this.logger.error(`Redis[${name}] connect failed: ${err.message}`));
    }

    this.clients[name] = client;
    return client;
  }

  getClient(name: string): Redis | undefined {
    return this.clients[name];
  }

  async onModuleDestroy() {
    const entries = Object.entries(this.clients);
    for (const [name, client] of entries) {
      try {
        await client.quit();
        this.logger.log(`Redis[${name}] quit`);
      } catch (e) {
        try {
          // fallback
          // @ts-ignore
          client.disconnect();
        } catch {}
      }
    }
  }
}

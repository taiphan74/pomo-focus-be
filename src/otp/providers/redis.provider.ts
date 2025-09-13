import { Provider } from '@nestjs/common';
import Redis from 'ioredis';

export const createClientProvider = (): Provider => ({
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const url = process.env.REDIS_URL;
    if (url) return new Redis(url);
    return new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    });
  },
});

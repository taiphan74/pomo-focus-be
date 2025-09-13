import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { REDIS_AUTH, REDIS_OTP } from './redis.constants';

const createAuthProvider = {
  provide: REDIS_AUTH,
  useFactory: (svc: RedisService, config: ConfigService) => {
    const db = parseInt(config.get<string>('REDIS_AUTH_DB') ?? config.get<string>('REDIS_DB') ?? '1', 10);
    const url = config.get<string>('REDIS_URL');
    const opts = url ? url : { db };
    return svc.createClient(REDIS_AUTH, opts as any);
  },
  inject: [RedisService, ConfigService],
};

const createOtpProvider = {
  provide: REDIS_OTP,
  useFactory: (svc: RedisService, config: ConfigService) => {
    const db = parseInt(config.get<string>('REDIS_OTP_DB') ?? config.get<string>('REDIS_DB') ?? '0', 10);
    const url = config.get<string>('REDIS_URL');
    const opts = url ? url : { db };
    return svc.createClient(REDIS_OTP, opts as any);
  },
  inject: [RedisService, ConfigService],
};

@Global()
@Module({
  providers: [RedisService, createAuthProvider, createOtpProvider],
  exports: [RedisService, createAuthProvider, createOtpProvider],
})
export class RedisModule {}

import { Inject, Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import type { Redis as IORedisClient } from 'ioredis';
import { REDIS_OTP } from '../redis/redis.constants';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  constructor(
    private readonly mailer: MailerService,
    @Inject(REDIS_OTP) private readonly redis: IORedisClient,
  ) {}

  private key(email: string) {
    return `otp:${email}`;
  }

  async requestOtp(dto: RequestOtpDto) {
    const ttlSeconds = parseInt(process.env.OTP_TTL_SEC || '300', 10); // 5m
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    await this.redis.set(this.key(dto.email), code, 'EX', ttlSeconds);
    await this.mailer.sendMail({
      to: dto.email,
      subject: 'Your OTP Code',
      text: `Your verification code is ${code}. It expires in ${Math.floor(ttlSeconds/60)} minutes.`,
    });
    return { sent: true };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const stored = await this.redis.get(this.key(dto.email));
    const ok = stored && stored === dto.code;
    if (ok) await this.redis.del(this.key(dto.email));
    return { valid: !!ok };
  }
}

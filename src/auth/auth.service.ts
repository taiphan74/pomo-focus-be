import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import type { Redis as IORedisClient } from 'ioredis';
import { REDIS_AUTH } from '../redis/redis.constants';
import { TokenService } from './token.service';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import type { Response, Request } from 'express';
import { parseDurationToMs } from '../utils/duration';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly tokenService: TokenService,
    @Inject(REDIS_AUTH) private readonly redis: IORedisClient,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return user;
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { passwordHash, ...result } = user as any;
    return result;
  }

  private async signTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.tokenService.signAccessToken(payload);
    const refreshToken = await this.tokenService.signRefreshToken(payload);
    return { accessToken, refreshToken };
  }

  async login(user: { id: string; email: string }, res: Response) {
  const { accessToken, refreshToken } = await this.signTokens(user.id, user.email);
  // store refresh token in Redis with TTL matching refresh expiry
  const envTtl = process.env.JWT_REFRESH_TTL_SEC;
  const ttlSeconds = envTtl && /^[0-9]+$/.test(envTtl)
    ? parseInt(envTtl, 10)
    : Math.round(parseDurationToMs(envTtl ?? process.env.JWT_REFRESH_EXPIRES_IN ?? '7d', 7 * 24 * 60 * 60 * 1000) / 1000);
  await this.redis.set(`refresh:${user.id}`, refreshToken, 'EX', ttlSeconds);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { success: true, access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    const payload = await this.tokenService.verify(refreshToken, { secret: process.env.JWT_SECRET });
    const stored = await this.redis.get(`refresh:${payload.sub}`);
    if (!stored || stored !== refreshToken) throw new UnauthorizedException('Invalid refresh token');
  const { accessToken, refreshToken: newRefresh } = await this.signTokens(payload.sub, payload.email);
  const envTtlNew = process.env.JWT_REFRESH_TTL_SEC;
  const ttlSecondsNew = envTtlNew && /^[0-9]+$/.test(envTtlNew)
    ? parseInt(envTtlNew, 10)
    : Math.round(parseDurationToMs(envTtlNew ?? process.env.JWT_REFRESH_EXPIRES_IN ?? '7d', 7 * 24 * 60 * 60 * 1000) / 1000);
  await this.redis.set(`refresh:${payload.sub}`, newRefresh, 'EX', ttlSecondsNew);
    this.setAuthCookies(res, accessToken, newRefresh);
    return { success: true, access_token: accessToken, refresh_token: newRefresh };
  }

  async logout(userId: string, res: Response) {
    await this.redis.del(`refresh:${userId}`);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = (process.env.NODE_ENV || 'development') === 'production';
  const accessMax = parseDurationToMs(process.env.ACCESS_COOKIE_MAX_AGE_MS, 1000 * 60 * 60);
  const refreshMax = parseDurationToMs(process.env.REFRESH_COOKIE_MAX_AGE_MS, 1000 * 60 * 60 * 24 * 7);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: accessMax,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: refreshMax,
    });
  }
}

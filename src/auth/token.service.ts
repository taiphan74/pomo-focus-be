import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async signAccessToken(payload: any) {
    return this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  }

  async signRefreshToken(payload: any) {
    return this.jwtService.signAsync(payload, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  }

  async verify(token: string, opts?: { secret?: string }) {
    return this.jwtService.verifyAsync(token, { secret: opts?.secret ?? process.env.JWT_SECRET });
  }
}

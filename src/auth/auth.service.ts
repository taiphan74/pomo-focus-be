import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import type { Response, Request } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
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
    // Exclude passwordHash
    const { passwordHash, ...result } = user as any;
    return result;
  }

  private async signTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
  }

  async login(user: { id: string; email: string }, res: Response) {
    const { accessToken, refreshToken } = await this.signTokens(user.id, user.email);
    await this.usersService.setRefreshToken(user.id, refreshToken);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { success: true, access_token: accessToken, refresh_token: refreshToken };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      ignoreExpiration: false,
      secret: process.env.JWT_SECRET || '7b248519-6c05-4656-a86c-cd46612c8218',
    });
    const user = await this.usersService.findByIdWithRefresh(payload.sub);
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException('Invalid refresh token');
    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) throw new UnauthorizedException('Invalid refresh token');
    const { accessToken, refreshToken: newRefresh } = await this.signTokens(user.id, user.email);
    await this.usersService.setRefreshToken(user.id, newRefresh);
    this.setAuthCookies(res, accessToken, newRefresh);
    return { success: true, access_token: accessToken, refresh_token: newRefresh };
  }

  async logout(userId: string, res: Response) {
    await this.usersService.clearRefreshToken(userId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = (process.env.NODE_ENV || 'development') === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60, // 1h
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7d
    });
  }
}

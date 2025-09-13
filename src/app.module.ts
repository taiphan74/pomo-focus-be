import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { OtpModule } from './otp/otp.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
  ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'tai_phan',
        password: process.env.POSTGRES_PASSWORD || '123456',
        database: process.env.POSTGRES_DB || 'pomo_focus',
        entities: [User],
        synchronize: true,
        logging: false,
      }),
    }),
    TypeOrmModule.forFeature([User]),
  UserModule,
  AuthModule,
  RedisModule,
  OtpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

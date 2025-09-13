import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  if (process.env.CORS_ORIGIN) {
    app.enableCors({
      origin: process.env.CORS_ORIGIN.split(','),
      credentials: true,
    });
  }

  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if ((process.env.NODE_ENV || 'development') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Pomo Focus API')
      .setDescription('API documentation for Pomo Focus')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT ?? 3000;

  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  if ((process.env.NODE_ENV || 'development') === 'development') {
    console.log(`Swagger docs available at: http://localhost:${port}/api`);
  }
}

bootstrap();

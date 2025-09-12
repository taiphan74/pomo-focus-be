import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

// Standard API response shape
// { success: boolean, data: any, message?: string, timestamp: string, path: string }
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request & { url?: string }>();

    return next.handle().pipe(
      map((data: any) => {
        // Preserve already-formatted responses
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request?.url ?? '',
        };
      }),
    );
  }
}

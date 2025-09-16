import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadsService } from './uploads.service';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'avatars');
if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
}

@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
                destination: UPLOADS_DIR,
                filename: (_req, file, cb) => {
                    const ext = (file.originalname || '').split('.').pop();
                    const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}.${ext || 'bin'}`;
                    cb(null, name);
                },
            }),
            limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
            fileFilter: (_req, file, cb) => {
                const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
                if (allowed.includes(file.mimetype)) cb(null, true);
                else cb(new Error('Only JPEG/PNG images are allowed'), false);
            },
        }),
    ],
    providers: [UploadsService],
    exports: [UploadsService, MulterModule],
})
export class UploadsModule {}
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { promises as fsPromises } from 'fs';

const AVATAR_BASE_URL = '/uploads/avatars'; // nếu muốn thay đổi, đưa vào config
const UPLOADS_ROOT = join(process.cwd(), 'uploads', 'avatars');

@Injectable()
export class UploadsService {
    private readonly logger = new Logger(UploadsService.name);

    /**
     * Lấy URL đầy đủ của file avatar
     * @param filename - Tên file
     * @returns URL đầy đủ của file
     */
    getAvatarUrl(filename: string): string | null {
        if (!filename) return null;
        return `${AVATAR_BASE_URL}/${filename}`;
    }

    /**
     * Lấy đường dẫn đầy đủ của file avatar
     * @param filename - Tên file
     * @returns Đường dẫn đầy đủ của file
     */
    getAvatarPath(filename: string): string {
        return join(UPLOADS_ROOT, filename);
    }

    /**
     * Xóa file avatar
     * @param filename - Tên file cần xóa
     */
    async deleteAvatar(filename: string): Promise<void> {
        if (!filename) return;
        const p = this.getAvatarPath(filename);
        try {
            await fsPromises.unlink(p);
            this.logger.log(`Deleted avatar file: ${p}`);
        } catch (err: any) {
            // nếu file không tồn tại thì bỏ qua, log khác thì lưu lại
            if (err.code !== 'ENOENT') {
                this.logger.warn(`Failed to delete avatar ${p}: ${err.message}`);
            }
        }
    }

    /**
     * Kiểm tra file có tồn tại không
     * @param filename - Tên file
     * @returns true nếu file tồn tại
     */
    async fileExists(filename: string): Promise<boolean> {
        try {
            const p = this.getAvatarPath(filename);
            await fsPromises.access(p);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate file upload
     * @param file - File được upload
     */
    validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new Error('Không có file được upload');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new Error('Chỉ được upload file ảnh (jpg, jpeg, png)');
        }

        // Multer already enforces file size limit; thêm check nếu cần
    }
}
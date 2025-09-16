import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Delete,
    Param,
    Get,
    Res,
    NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadsService } from './uploads.service';
import { join } from 'path';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) {}

    @Post('avatar')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'Upload avatar' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Avatar uploaded successfully',
        schema: {
            type: 'object',
            properties: {
                filename: { type: 'string' },
                url: { type: 'string' },
                message: { type: 'string' },
            },
        },
    })
    async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
        try {
            this.uploadsService.validateFile(file);
            
            return {
                filename: file.filename,
                url: this.uploadsService.getAvatarUrl(file.filename),
                message: 'Avatar uploaded successfully',
            };
        } catch (error) {
            // Xóa file nếu có lỗi validation
            if (file && file.filename) {
                await this.uploadsService.deleteAvatar(file.filename);
            }
            throw new BadRequestException(error.message);
        }
    }

    @Delete('avatar/:filename')
    @ApiOperation({ summary: 'Delete avatar' })
    @ApiResponse({
        status: 200,
        description: 'Avatar deleted successfully',
    })
    async deleteAvatar(@Param('filename') filename: string) {
        try {
            await this.uploadsService.deleteAvatar(filename);
            return {
                message: 'Avatar deleted successfully',
            };
        } catch (error) {
            throw new BadRequestException('Lỗi khi xóa avatar');
        }
    }

    @Get('avatars/:filename')
    @ApiOperation({ summary: 'Get avatar file' })
    @ApiResponse({
        status: 200,
        description: 'Avatar file',
    })
    async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = this.uploadsService.getAvatarPath(filename);
        
        if (!this.uploadsService.fileExists(filename)) {
            throw new NotFoundException('Avatar not found');
        }

        return res.sendFile(filePath);
    }
}
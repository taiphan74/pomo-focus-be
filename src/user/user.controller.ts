import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile, Delete, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UploadsService } from '../uploads/uploads.service';

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly uploadsService: UploadsService,
    ) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }

    @Get()
    async findAll() {
        return this.userService.findAll();
    }

    @Post(':id/avatar')
    @UseInterceptors(FileInterceptor('file'))
    async uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        try {
            this.uploadsService.validateFile(file);
            // update user record with avatar filename
            const updated = await this.userService.updateAvatar(id, file.filename);
            return {
                message: 'Avatar uploaded',
                filename: file.filename,
                url: this.uploadsService.getAvatarUrl(file.filename),
                user: updated,
            };
        } catch (error) {
            // remove file if validation/update fails
            if (file && file.filename) {
                await this.uploadsService.deleteAvatar(file.filename);
            }
            throw new BadRequestException(error.message);
        }
    }

    @Delete(':id/avatar')
    async deleteAvatar(@Param('id') id: string) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.avatar) {
            await this.uploadsService.deleteAvatar(user.avatar);
            await this.userService.removeAvatar(id);
        }

        return { message: 'Avatar removed' };
    }
}
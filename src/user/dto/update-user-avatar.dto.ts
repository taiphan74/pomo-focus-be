import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserAvatarDto {
    @ApiProperty({ 
        example: 'avatar-1234567890-123.jpg', 
        description: 'Tên file avatar mới',
        required: false 
    })
    @IsOptional()
    @IsString()
    avatar?: string;
}
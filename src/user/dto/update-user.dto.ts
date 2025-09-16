import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({ 
        example: 'avatar-1234567890-123.jpg', 
        description: 'Tên file avatar',
        required: false 
    })
    @IsOptional()
    @IsString()
    avatar?: string;
}
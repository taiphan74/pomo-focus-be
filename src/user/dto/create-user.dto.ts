import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'Email của người dùng' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'strongPassword123', minLength: 6, description: 'Mật khẩu của người dùng (tối thiểu 6 ký tự)' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
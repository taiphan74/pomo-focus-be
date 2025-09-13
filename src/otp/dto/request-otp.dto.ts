import { IsEmail, IsString, Length } from 'class-validator';

export class RequestOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(3, 50)
  reason: string;
}

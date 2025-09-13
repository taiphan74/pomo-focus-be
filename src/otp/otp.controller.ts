import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('otp')
@Controller('otp')
export class OtpController {
  constructor(private readonly otp: OtpService) {}

  @ApiOperation({ summary: 'Request an OTP via email' })
  @Post('request')
  request(@Body() dto: RequestOtpDto) {
    return this.otp.requestOtp(dto);
  }

  @ApiOperation({ summary: 'Verify an OTP code' })
  @Post('verify')
  verify(@Body() dto: VerifyOtpDto) {
    return this.otp.verifyOtp(dto);
  }
}

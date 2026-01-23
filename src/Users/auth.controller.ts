import type { Response } from 'express';
import { 
  Controller, 
  Post, 
  Body, 
  Res, 
  BadRequestException 
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly Service: AuthService) {}


  // 🔹 SEND OTP (forgot password)
  @Post('send_otp')
  async sendOtp(@Body() body: { hospitalId: number; userId: string; otp: string }) {
    const { hospitalId, userId, otp } = body;

    if (!hospitalId) {
      throw new BadRequestException({ status: 'error', message: 'hospitalId is required' });
    }
    if (!userId) {
      throw new BadRequestException({ status: 'error', message: 'userId is required' });
    }
    if (!otp) {
      throw new BadRequestException({ status: 'error', message: 'OTP is required' });
    }

    return this.Service.sendOtp(hospitalId, userId, otp);
  }

  // 🔹 UPDATE PASSWORD (after OTP verification)
  @Post('update_password')
  async updatePassword(@Body() body: { hospitalId: number; userId: string; newPassword: string }) {
    const { hospitalId, userId, newPassword } = body;

    if (!hospitalId) {
      throw new BadRequestException({ status: 'error', message: 'hospitalId is required' });
    }
    if (!userId) {
      throw new BadRequestException({ status: 'error', message: 'userId is required' });
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException({
        status: 'error',
        message: 'Password must be at least 6 characters long',
      });
    }

    return this.Service.updatePassword(hospitalId, userId, newPassword);
  }
}
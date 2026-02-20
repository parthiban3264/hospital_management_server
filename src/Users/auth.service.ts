import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { log } from 'console';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  async sendOtp(hospitalId: number, userId: string, otp: string) {
    const admin = await prisma.admin.findUnique({
      where: {
        hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId },
      },
    });

    // Admin not found
    if (!admin) {
      throw new NotFoundException({
        message: 'User not found',
      });
    }

    // Email not found
    if (!admin.email) {
      throw new NotFoundException({
        message: 'Email not found',
        code: 'EMAIL_NOT_FOUND',
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'Noreply.ramchintech@gmail.com',
        pass: 'zkvb rmyu yqtm ipgv', // 🔒 app password
      },
    });

    await transporter.sendMail({
      from: 'Noreply.ramchintech@gmail.com',
      to: admin.email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
    });

    return { status: 'success', message: 'OTP sent successfully' };
  }

  async updatePassword(
    hospitalId: number,
    userId: string,
    newPassword: string,
  ) {
    const user = await prisma.user.findUnique({
      where: {
        hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: {
        hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId },
      },
      data: { password: hashed },
    });
    // write  logic for logout all device
    return {
      status: 'success',
      message: 'Password updated successfully write logout code',
    };
  }

  // async adminResetPassword(hospitalId: number, userId: string) {
  //   log('work',userId);
  //   const user = await prisma.user.findUnique({
  //     where: { hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId } },
  //   });
  //   const newPassword = 'abc123'
  //   if (!user) throw new NotFoundException('User not found');

  //   const hashed = await bcrypt.hash(newPassword, 12);
  //   await prisma.user.update({
  //     where: { hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId } },
  //     data: { password: hashed },
  //   });
  //    return { status: 'success', message: 'Password updated successfully' };
  // }
  async adminResetPassword(hospitalId: number, userId: number) {
    log('work', userId);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        hospital_Id: hospitalId,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const newPassword = 'abc123';
    const hashed = await bcrypt.hash(newPassword, 12);
    log('hased', hashed);

    const users = await prisma.user.update({
      where: {
        id: userId, // ✅ works correctly now
        hospital_Id: hospitalId,
      },
      data: {
        password: hashed,
      },
    });
    log('users', users);

    return {
      status: 'success',
      message: 'Password updated successfully',
    };
  }
}

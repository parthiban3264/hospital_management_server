import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {

  async sendOtp(hospitalId: number, userId: string, otp: string) {
    const admin = await prisma.admin.findUnique({
      where: { hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId } },
    });

    if (!admin?.email)
      throw new NotFoundException({ message: 'Email not found' });

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

  async updatePassword(hospitalId: number, userId: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId } },
    });
    if (!user) throw new NotFoundException('User not found');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { hospital_Id_user_Id: { hospital_Id: hospitalId, user_Id: userId } },
      data: { password: hashed },
    });

// write  logic for logout all device 
    return { status: 'success', message: 'Password updated successfully write logout code' };
  }
}
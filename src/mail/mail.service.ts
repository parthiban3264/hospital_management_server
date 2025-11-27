import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
        
      const info = await this.transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Mail sent to ${to} (id=${info.messageId})`);
      return info;
    } catch (err) {
      this.logger.error(`Failed to send mail to ${to}`, err);
      throw err;
    }
  }
}

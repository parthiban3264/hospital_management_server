// submit-ticket.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateSubmitTicketDto } from './dto/create-submit.dto';
import * as nodemailer from 'nodemailer';

const prisma = new PrismaClient();

@Injectable()
export class SubmitTicketService {
  // Create a new ticket
  async create(dto: CreateSubmitTicketDto,hospital_Id) {
    // 1️⃣ Create the ticket
const ticket = await prisma.submitTicket.create({
  data: {
    hospital_Id: hospital_Id,
    admin_Id: dto.admin_Id,
    description: dto.description,
  },
});

    // 2️⃣ Fetch admin details for that lodge/user
    const admin = await prisma.admin.findFirst({
      where: {
        hospital_Id: hospital_Id,
        user_Id: dto.admin_Id,
      },
    });

    if (!admin) {
      console.warn(
        '⚠️ Admin not found for hospital_id:',
        hospital_Id,
        'user_id:',
        dto.admin_Id,
      );
      return ticket;
    }

    // 3️⃣ Configure Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'Noreply.ramchintech@gmail.com',
        pass: 'zkvb rmyu yqtm ipgv', // ⚠️ consider using env variable instead
      },
    });

    // 4️⃣ Notify main admin
    await transporter.sendMail({
      from: '"Hospital Management Ticket System" <Noreply.ramchintech@gmail.com>',
      to: 'ramchintech@gmail.com', // main inbox
      subject: `🎫 New Ticket from ${admin.name}`,
      html: `
        <h2>New Ticket Submitted</h2>
        <p><strong>Shop ID:</strong> ${hospital_Id}</p>
        <p><strong>User ID:</strong> ${dto.admin_Id}</p>
        <p><strong>Name:</strong> ${admin.name}</p>
        <p><strong>Email:</strong> ${admin.email}</p>
        <p><strong>Phone:</strong> ${admin.phone}</p>
        <p><strong>Issue:</strong> ${dto.description}</p>
        <p><strong>Submitted At:</strong> ${ticket.created_at}</p>
      `,
    });

    // 5️⃣ Confirmation to submitting admin
    await transporter.sendMail({
      from: '"Hospital Management Ticket System" <Noreply.ramchintech@gmail.com>',
      to: admin.email,
      subject: '✅ Ticket Submitted Successfully',
      html: `
        <h3>Dear ${admin.name},</h3>
        <p>Your ticket has been successfully submitted.</p>
        <p><strong>Issue:</strong> ${dto.description}</p>
        <p>We will review your request and respond shortly.</p>
        <p>Thank you!</p>
      `,
    });

    return {
      message: 'Ticket submitted successfully and emails sent.',
      ticket,
    };
  }

  // Get all tickets
  async findAll() {
    return prisma.submitTicket.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Get all tickets for a specific lodge
  async findAllByShop(hospital_Id: number) {
    return prisma.submitTicket.findMany({
      where: { hospital_Id },
      orderBy: { created_at: 'desc' },
    });
  }

  // Get single ticket by ID
  async findOne(id: number) {
    const ticket = await prisma.submitTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket with ID ${id} not found`);
    return ticket;
  }


  // Delete a ticket
  async remove(id: number) {
    await this.findOne(id);
    return prisma.submitTicket.delete({ where: { id } });
  }
}

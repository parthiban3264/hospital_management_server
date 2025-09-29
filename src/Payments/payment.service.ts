import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          reason: data.reason,
          status: data.status,
          amount: data.amount,
          transactionId: data.transactionId,
          billingId: data.billingId,
        },
      });
      return { status: "success", message: "Payment created", data: payment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const payments = await this.prisma.payment.findMany({
      include: { Hospital: true, Patient: true },
    });
    return { status: "success", message: "Payments fetched", data: payments };
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return { status: "success", message: "Payment fetched", data: payment };
  }

  async update(id: number, data: any) {
    try {
      const payment = await this.prisma.payment.update({
        where: { id },
        data,
      });
      return { status: "success", message: "Payment updated", data: payment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const payment = await this.prisma.payment.delete({ where: { id } });
      return { status: "success", message: "Payment deleted", data: payment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

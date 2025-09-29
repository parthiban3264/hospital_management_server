import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ConsultationService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const consultation = await this.prisma.consultation.create({
        data,
      });
      return { status: "success", message: "Consultation created", data: consultation };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const consultations = await this.prisma.consultation.findMany({
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
      },
    });
    return { status: "success", message: "Consultations fetched", data: consultations };
  }

  async findOne(id: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Doctor: true },
    });

    if (!consultation) throw new NotFoundException(`Consultation with ID ${id} not found`);
    return { status: "success", message: "Consultation fetched", data: consultation };
  }

  async update(id: number, data: any) {
    try {
      const consultation = await this.prisma.consultation.update({
        where: { id },
        data,
      });
      return { status: "success", message: "Consultation updated", data: consultation };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const consultation = await this.prisma.consultation.delete({ where: { id } });
      return { status: "success", message: "Consultation deleted", data: consultation };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

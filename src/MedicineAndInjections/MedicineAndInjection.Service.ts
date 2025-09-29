import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MedicineAndInjectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const record = await this.prisma.medicineAndInjection.create({
        data: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          doctor_Id: data.doctor_Id,
          staff_Id: data.staff_Id,
          medicine_Id: data.medicine_Id,
          frequencyMedicine: data.frequencyMedicine,
          injection_Id: data.injection_Id,
          frequencyInjection: data.frequencyInjection,
          status: data.status,
          notes: data.notes,
          paymentStatus: data.paymentStatus,
        },
      });
      return { status: "success", message: "Record created", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const records = await this.prisma.medicineAndInjection.findMany({
      include: { Hospital: true, Patient: true, Medician: true, Injection: true },
    });
    return { status: "success", message: "Records fetched", data: records };
  }

  async findOne(id: number) {
    const record = await this.prisma.medicineAndInjection.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Medician: true, Injection: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: "success", message: "Record fetched", data: record };
  }

  async update(id: number, data: any) {
    try {
      const record = await this.prisma.medicineAndInjection.update({
        where: { id },
        data,
      });
      return { status: "success", message: "Record updated", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const record = await this.prisma.medicineAndInjection.delete({ where: { id } });
      return { status: "success", message: "Record deleted", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

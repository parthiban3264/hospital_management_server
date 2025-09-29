import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TestingAndScanningPatientService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const record = await this.prisma.testingAndScanningPatient.create({
        data: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          doctor_Id: data.doctor_Id,
          staff_Id: data.staff_Id,
          title: data.title,
          scheduleDate: new Date(data.scheduleDate),
          type: data.type,
          status: data.status,
          paymentStatus: data.paymentStatus,
          result: data.result,
        },
      });
      return { status: "success", message: "Record created", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      include: { Hospital: true, Patient: true },
    });
    return { status: "success", message: "Records fetched", data: records };
  }

  async findOne(id: number) {
    const record = await this.prisma.testingAndScanningPatient.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: "success", message: "Record fetched", data: record };
  }

  async update(id: number, data: any) {
    try {
      const record = await this.prisma.testingAndScanningPatient.update({
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
      const record = await this.prisma.testingAndScanningPatient.delete({
        where: { id },
      });
      return { status: "success", message: "Record deleted", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

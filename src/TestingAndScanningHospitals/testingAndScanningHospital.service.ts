import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TestingAndScanningHospitalService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const record = await this.prisma.testingAndScanningHospital.create({
        data: {
          hospital_Id: data.hospital_Id,
          type: data.type,
          status: data.status,
          roomNo: data.roomNo,
          staff_Id: data.staff_Id,
          amount: data.amount,
        },
      });
      return { status: "success", message: "Record created", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const records = await this.prisma.testingAndScanningHospital.findMany({
      include: { Hospital: true },
    });
    return { status: "success", message: "Records fetched", data: records };
  }

  async findOne(id: number) {
    const record = await this.prisma.testingAndScanningHospital.findUnique({
      where: { id },
      include: { Hospital: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: "success", message: "Record fetched", data: record };
  }

  async update(id: number, data: any) {
    try {
      const record = await this.prisma.testingAndScanningHospital.update({
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
      const record = await this.prisma.testingAndScanningHospital.delete({
        where: { id },
      });
      return { status: "success", message: "Record deleted", data: record };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

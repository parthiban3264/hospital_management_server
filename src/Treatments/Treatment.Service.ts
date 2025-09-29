import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TreatmentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const treatment = await this.prisma.treatment.create({ data });
      return { status: "success", message: "Treatment created", data: treatment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const treatments = await this.prisma.treatment.findMany({
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
        Staff: true,
      },
    });
    return { status: "success", message: "Treatments fetched", data: treatments };
  }

  async findOne(id: number) {
    const treatment = await this.prisma.treatment.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Doctor: true, Staff: true },
    });

    if (!treatment) throw new NotFoundException(`Treatment with ID ${id} not found`);
    return { status: "success", message: "Treatment fetched", data: treatment };
  }

  async update(id: number, data: any) {
    try {
      const treatment = await this.prisma.treatment.update({ where: { id }, data });
      return { status: "success", message: "Treatment updated", data: treatment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const treatment = await this.prisma.treatment.delete({ where: { id } });
      return { status: "success", message: "Treatment deleted", data: treatment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

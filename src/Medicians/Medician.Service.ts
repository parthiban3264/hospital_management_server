import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MedicianService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const medician = await this.prisma.medician.create({ data });
      return { status: "success", message: "Medician created", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const medicianList = await this.prisma.medician.findMany({
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Medicians fetched", data: medicianList };
  }

  async findOne(id: number) {
    const medician = await this.prisma.medician.findUnique({
      where: { id },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    if (!medician) throw new NotFoundException(`Medician with ID ${id} not found`);
    return { status: "success", message: "Medician fetched", data: medician };
  }

  async update(id: number, data: any) {
    try {
      const medician = await this.prisma.medician.update({ where: { id }, data });
      return { status: "success", message: "Medician updated", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const medician = await this.prisma.medician.delete({ where: { id } });
      return { status: "success", message: "Medician deleted", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

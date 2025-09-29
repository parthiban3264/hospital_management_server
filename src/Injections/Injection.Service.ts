import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class InjectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const injection = await this.prisma.injection.create({
        data: {
          hospital_Id: data.hospital_Id,
          injectionName: data.injectionName,
          stock: data.stock,
          amount: data.amount,
          staff_Id: data.staff_Id,
        },
      });
      return { status: "success", message: "Injection created", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const injections = await this.prisma.injection.findMany({
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Injections fetched", data: injections };
  }

  async findOne(id: number) {
    const injection = await this.prisma.injection.findUnique({
      where: { id },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    if (!injection) throw new NotFoundException(`Injection with ID ${id} not found`);
    return { status: "success", message: "Injection fetched", data: injection };
  }

  async update(id: number, data: any) {
    try {
      const injection = await this.prisma.injection.update({ where: { id }, data });
      return { status: "success", message: "Injection updated", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const injection = await this.prisma.injection.delete({ where: { id } });
      return { status: "success", message: "Injection deleted", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminStratorService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const adminStrator = await this.prisma.adminStrator.create({
        data: {
          user_Id: data.user_Id,
          name: data.name,
          status: data.status,
          designation: data.designation,
          phone: data.phone,
          email: data.email,
          photo: data.photo,
          address: data.address,
          gender: data.gender,
        },
      });
      return { status: "success", message: "AdminStrator created", data: adminStrator };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const admins = await this.prisma.adminStrator.findMany({
      include: { User: true },
    });
    return { status: "success", message: "AdminStrators fetched", data: admins };
  }

  async findOne(id: number) {
    const admin = await this.prisma.adminStrator.findUnique({
      where: { id },
      include: { User: true },
    });

    if (!admin) throw new NotFoundException(`AdminStrator with ID ${id} not found`);

    return { status: "success", message: "AdminStrator fetched", data: admin };
  }

  async update(id: number, data: any) {
    try {
      const admin = await this.prisma.adminStrator.update({
        where: { id },
        data,
      });
      return { status: "success", message: "AdminStrator updated", data: admin };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const admin = await this.prisma.adminStrator.delete({ where: { id } });
      return { status: "success", message: "AdminStrator deleted", data: admin };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

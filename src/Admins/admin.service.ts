import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

async create(data: any) {
  try {
    const admin = await this.prisma.admin.create({
      data: {
        hospital_Id: data.hospital_Id, // must exist in Hospital table
        user_Id: data.user_Id,         // must exist in User table
        name: data.name,
        designation: data.designation,
        phone: data.phone,
        email: data.email,
        address: data.address,
        photo: data.photo,
        status: data.status,
        gender: data.gender,
      },
    });

    return {
      status: "success",
      message: "Admin created successfully",
      data: admin,
    };
  } catch (error) {
    return {
      status: "failed",
      error: error.message,
    };
  }
}


  async findAll() {
    return this.prisma.admin.findMany({
      include: { Hospital: true, User: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.admin.findUnique({
      where: { id },
      include: { Hospital: true, User: true },
    });
  }

  async update(id: number, data: any) {
    try {
      const admin = await this.prisma.admin.update({
        where: { id },
        data,
      });
      return { status: "success", data: admin };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.admin.delete({ where: { id } });
      return { status: "success", message: "Admin deleted" };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

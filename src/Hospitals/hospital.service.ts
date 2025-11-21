import { Injectable } from "@nestjs/common";
import { stat } from "fs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class HospitalService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    console.log('work');
    
    try {
      const hospital = await this.prisma.hospital.create({ data });
      return { data: hospital, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }

  async findAll() {
    try {
      const hospitals = await this.prisma.hospital.findMany({
      include: {
          Admins: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            designation: true,
            role: true,
            status: true,
          }
        }
      }
      });
      return { data: hospitals, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }

  async findOne(id: number) {
    try {
      const hospital = await this.prisma.hospital.findUnique({ where: { id } });
      if (!hospital) throw new Error("Hospital not found");
      return { data: hospital, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }

 async update(id: number, data: any) {
  try {
    // Check if hospital exists
    const existingHospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!existingHospital) {
      return { error: "Hospital not found", status: "failed" };
    }

    const hospital = await this.prisma.hospital.update({
      where: { id },
      data,
    });

    return { data: hospital, status: "success" };
  } catch (error) {
    return { error: error.message, status: "failed" };
  }
}


  async remove(id: number) {
    try {
      const hospital = await this.prisma.hospital.delete({ where: { id } });
      return { data: hospital, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ButtonPermissionService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.buttonPermission.create({
      data,
    });
  }

  async createMany(dataArray: any[]) {
    return this.prisma.buttonPermission.createMany({
      data: dataArray,
      skipDuplicates: true, // avoids unique key conflicts
    });
  }

  async findAll() {
    return this.prisma.buttonPermission.findMany();
  }
    async findAllByHospital(hospital_Id: number) {
    return this.prisma.buttonPermission.findMany({
      where: { hospital_Id },   
    });
    }

  async findOne(id: number) {
    return this.prisma.buttonPermission.findUnique({ where: { id } });
  }

  async update(id: number, data: any) {
    return this.prisma.buttonPermission.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.buttonPermission.delete({ where: { id } });
  }
}

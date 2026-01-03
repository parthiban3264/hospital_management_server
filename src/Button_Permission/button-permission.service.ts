import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ButtonPermissionService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.buttonPermissions.create({
      data,
    });
  }

  async createMany(dataArray: any[]) {
    return this.prisma.buttonPermissions.createMany({
      data: dataArray,
      skipDuplicates: true, // avoids unique key conflicts
    });
  }

  async findAll() {
    return this.prisma.buttonPermissions.findMany();
  }
    async findAllByHospital(hospital_Id: number) {
    return this.prisma.buttonPermissions.findMany({
      where: { hospital_Id },   
    });
    }

  async findOne(id: number) {
    return this.prisma.buttonPermissions.findUnique({ where: { id } });
  }

  async update(id: number, data: any) {
    return this.prisma.buttonPermissions.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.buttonPermissions.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.FeesCreateInput) {
    return this.prisma.fees.create({ data });
  }

  async findAll() {
    return this.prisma.fees.findMany();
  }

  async findByHospital(hospitalId: number) {
    return this.prisma.fees.findMany({
      where: { hospital_Id: hospitalId },
    });
  }

  async findOne(id: number) {
    return this.prisma.fees.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.FeesUpdateInput) {
    return this.prisma.fees.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.fees.delete({
      where: { id },
    });
  }
}

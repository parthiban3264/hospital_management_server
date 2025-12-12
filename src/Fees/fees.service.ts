import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { log } from 'console';

@Injectable()
export class FeesService {
  constructor(private prisma: PrismaService) {}

 async create(data: any) {
  log("Creating fees with data:", data);

  return this.prisma.fees.create({
    data: {
      hospital_Id: Number(data.hospital_Id) || Number(data.hospitalId),
      type: data.type,
      amount: Number(data.amount),
    },
  });
}


  async findAll() {
    return this.prisma.fees.findMany();
  }

  async findByHospital(hospitalId: number) {
    log('Finding fees for hospital ID:', hospitalId);
    return this.prisma.fees.findMany({
      where: { hospital_Id: hospitalId },
    });
  }

  async findOne(id: number) {
    return this.prisma.fees.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: any) {
    console.log('Updating fees with data:', data);
    return this.prisma.fees.update({
      where: { id },
      data :{
         hospital_Id: Number(data.hospital_Id),
      type: data.type,
      amount: Number(data.amount),
      },
    });
  }

  async remove(id: number) {
    return this.prisma.fees.delete({
      where: { id },
    });
  }
}

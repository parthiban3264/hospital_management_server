import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DrawerService {
  constructor(private prisma: PrismaService) {}

  // Create
  async create(data: any) {
    return this.prisma.drawer.create({ data });
  }

 async findAll(hospital_Id: number) {
  return this.prisma.drawer.findMany({
    where: { hospital_Id },
    orderBy: { id: 'desc' },
  });
}


  // Find one by id
  async findOne(id: number) {
    return this.prisma.drawer.findUnique({ where: { id } });
  }

  // Update
  async update(id: number, data: any) {
    return this.prisma.drawer.update({ where: { id }, data });
  }

  // Delete
  async remove(id: number) {
    return this.prisma.drawer.delete({ where: { id } });
  }
}

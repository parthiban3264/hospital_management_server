import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async getContactInfo() {
    const data = await this.prisma.play_store_customar.findMany();
    return data;
  }

  async createContact(data: any) {
    const createData = await this.prisma.play_store_customar.create({
      data: {
        ...data,
      },
    });
    return createData;
  }

  async updateContact(id: number, data: any) {
    const updateData = await this.prisma.play_store_customar.update({
      where: { id },
      data: {
        ...data,
      },
    });
    return updateData;
  }

  async deleteContact(id: number) {
    const deleteData = await this.prisma.play_store_customar.delete({
      where: { id },
    });
    return deleteData;
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Types } from '@prisma/client';

@Injectable()
export class TestAndScanService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(data: Prisma.ScanAndTestCreateManyInput[]) {
    try {
      const result = await this.prisma.scanAndTest.createMany({
        data: data.map((item) => ({
          hospital_Id: 1,
          title: item.title,
          type: item.type,
          options: item.options,
          crearedAt: item.crearedAt,
          updatedAt: item.updatedAt,
        })),
      });

      return {
        status: 'success',
        message: `${result.count} records created successfully`,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  // FIND ALL
  findAll(hospital_Id: number, type :Types) {
    return this.prisma.scanAndTest.findMany({
      where: {
        hospital_Id,
        type,
      },
    });
  }

  // FIND ONE
  findOne(id: number) {
    return this.prisma.scanAndTest.findUnique({
      where: { id },
    });
  }

  // UPDATE
  update(id: number, data: Prisma.ScanAndTestUpdateInput) {
    return this.prisma.scanAndTest.update({
      where: { id },
      data,
    });
  }

  // DELETE
  remove(id: number) {
    return this.prisma.scanAndTest.delete({
      where: { id },
    });
  }
}

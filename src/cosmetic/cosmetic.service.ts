import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CosmeticService {
  constructor(private prisma: PrismaService) {}

  create(data: any[]) {
    return this.prisma.cosmetic.createMany({ data });
  }

  findAll(hospital_Id: number) {
    return this.prisma.cosmetic.findMany({
      where: { hospital_Id },
      include: { Hospital: true },
    });
  }

  findOne(id: number) {
    return this.prisma.cosmetic.findUnique({
      where: { id },
      include: { Hospital: true },
    });
  }

  update(id: number, data: any) {
    return this.prisma.cosmetic.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.cosmetic.delete({
      where: { id },
    });
  }
}

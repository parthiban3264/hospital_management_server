import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ScanAndTestUnitReferenceService {
  constructor(private prisma: PrismaService) {}

  async create(body: any) {
    try {
      return await this.prisma.scanAndTestUnitReferencewithPerHospital.create({
        data: {
          hospital_Id: body.hospital_Id,
          optionName: body.optionName,
          optionTitle: body.optionTitle,
          type: body.type,
          unit: body.unit,
          reference: body.reference,
        },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findByHospital(hospitalId: number) {
    return this.prisma.scanAndTestUnitReferencewithPerHospital.findMany({
      where: { hospital_Id: hospitalId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: number) {
    return this.prisma.scanAndTestUnitReferencewithPerHospital.delete({
      where: { id },
    });
  }

  private handlePrismaError(error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Duplicate option for this hospital (optionName + optionTitle)',
        );
      }
    }
    throw error;
  }
}

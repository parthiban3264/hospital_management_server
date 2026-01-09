import { Module } from '@nestjs/common';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PrescriptionController],
  providers: [PrescriptionService, PrismaService],
  exports: [PrescriptionService]
})
export class PrescriptionModule {}

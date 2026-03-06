import { Module } from '@nestjs/common';
import { PrescriptionController } from './prescription.controller';
import { PrescriptionService } from './prescription.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionServiceCron } from './daily_missed_crons';

@Module({
  controllers: [PrescriptionController],
  providers: [PrescriptionService, PrismaService,PrescriptionServiceCron],
  exports: [PrescriptionService],
})
export class PrescriptionModule {}

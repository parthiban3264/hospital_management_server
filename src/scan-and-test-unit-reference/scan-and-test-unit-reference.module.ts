import { Module } from '@nestjs/common';
import { ScanAndTestUnitReferenceController } from './scan-and-test-unit-reference.controller';
import { ScanAndTestUnitReferenceService } from './scan-and-test-unit-reference.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ScanAndTestUnitReferenceController],
  providers: [ScanAndTestUnitReferenceService, PrismaService],
})
export class ScanAndTestUnitReferenceModule {}

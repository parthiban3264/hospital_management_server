import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestAndScanService } from './test-scans.service';
import { ScanAndTestController } from './test-scans.controller';

@Module({
  controllers: [ScanAndTestController],
  providers: [TestAndScanService, PrismaService],
})
export class ScanAndTestsModule {}

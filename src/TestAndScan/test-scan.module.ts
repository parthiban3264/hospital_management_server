import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestAndScanService } from './test-scan.service';
import { ScanAndTestController } from './test-scan.controller';

@Module({
  controllers: [ScanAndTestController],
  providers: [TestAndScanService, PrismaService],
})
export class ScanAndTestModule {}

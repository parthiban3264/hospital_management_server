import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [FeesController],
  providers: [FeesService, PrismaService],
})
export class FeesModule {}

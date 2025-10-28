import { Module } from '@nestjs/common';
import { TonicService } from './tonic.service';
import { TonicController } from './tonic.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TonicController],
  providers: [TonicService, PrismaService],
})
export class TonicModule {}

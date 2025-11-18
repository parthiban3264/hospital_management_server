import { Module } from '@nestjs/common';
import { DrawerService } from './drawer.service';
import { DrawerController } from './drawer.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DrawerController],
  providers: [DrawerService, PrismaService],
})
export class DrawerModule {}

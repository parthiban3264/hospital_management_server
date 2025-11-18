import { Module } from '@nestjs/common';
import { DrawerService } from './drawer.Service';
import { DrawerController } from './drawer.Controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [DrawerController],
  providers: [DrawerService, PrismaService],
})
export class DrawerModule {}

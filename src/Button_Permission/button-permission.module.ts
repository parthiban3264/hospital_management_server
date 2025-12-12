import { Module } from '@nestjs/common';
import { ButtonPermissionService } from './button-permission.service';
import { ButtonPermissionController } from './button-permission.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ButtonPermissionController],
  providers: [ButtonPermissionService, PrismaService],
})
export class ButtonPermissionModule {}

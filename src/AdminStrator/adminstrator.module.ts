import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AdminStratorService } from "./adminstrator.service";
import { AdminStratorController } from "./adminstrator.controller";

@Module({
  controllers: [AdminStratorController],
  providers: [AdminStratorService, PrismaService],
  exports: [AdminStratorService], // optional if other modules need it
})
export class AdminStratorModule {}

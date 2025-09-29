import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { ConsultationService } from "./consultation.service";
import { ConsultationController } from "./consultation.controller";

@Module({
  controllers: [ConsultationController],
  providers: [ConsultationService, PrismaService],
  exports: [ConsultationService],
})
export class ConsultationModule {}

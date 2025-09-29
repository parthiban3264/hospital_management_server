import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConsultationService } from "./Consultation.Service";
import { ConsultationController } from "./Consultation.Controller";

@Module({
  controllers: [ConsultationController],
  providers: [ConsultationService, PrismaService],
  exports: [ConsultationService],
})
export class ConsultationModule {}

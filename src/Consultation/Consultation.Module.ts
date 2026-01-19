import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ConsultationService } from "./Consultation.Service";
import { ConsultationController } from "./Consultation.Controller";
import { ConsultationGateway } from "./consultation.gateway";
import { ConsultationStatusCron } from "./cron/consultation-status.cron";

@Module({
  controllers: [ConsultationController],
  providers: [ConsultationService,ConsultationGateway, PrismaService,ConsultationStatusCron],
  exports: [ConsultationService],
})
export class ConsultationModule {}

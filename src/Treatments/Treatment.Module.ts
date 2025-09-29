import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TreatmentService } from "./Treatment.Service";
import { TreatmentController } from "./Treatment.Controller";

@Module({
  controllers: [TreatmentController],
  providers: [TreatmentService, PrismaService],
  exports: [TreatmentService],
})
export class TreatmentModule {}

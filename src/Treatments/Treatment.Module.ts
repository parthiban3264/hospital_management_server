import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TreatmentService } from "./treatment.service";
import { TreatmentController } from "./treatment.controller";

@Module({
  controllers: [TreatmentController],
  providers: [TreatmentService, PrismaService],
  exports: [TreatmentService],
})
export class TreatmentModule {}

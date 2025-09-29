import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MedicineAndInjectionService } from "./medicineAndInjection.service";
import { MedicineAndInjectionController } from "./medicineAndInjection.controller";

@Module({
  controllers: [MedicineAndInjectionController],
  providers: [MedicineAndInjectionService, PrismaService],
  exports: [MedicineAndInjectionService],
})
export class MedicineAndInjectionModule {}

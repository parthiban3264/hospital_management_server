import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MedicineAndInjectionService } from "./MedicineAndInjection.Service";
import { MedicineAndInjectionController } from "./MedicineAndInjection.Controller";

@Module({
  controllers: [MedicineAndInjectionController],
  providers: [MedicineAndInjectionService, PrismaService],
  exports: [MedicineAndInjectionService],
})
export class MedicineAndInjectionModule {}

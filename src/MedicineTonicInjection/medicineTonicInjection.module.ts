import { Module } from "@nestjs/common";
import { MedicineTonicInjectionController } from "./medicineTonicInjection.controller";
import { MedicineTonicInjectionService } from "./medicineTonicInjection.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  controllers: [MedicineTonicInjectionController],
  providers: [MedicineTonicInjectionService, PrismaService],
})
export class MedicineTonicInjectionModule {}

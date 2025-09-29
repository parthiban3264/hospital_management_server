import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MedicianService } from "./Medician.Service";
import { MedicianController } from "./Medician.Controller";

@Module({
  controllers: [MedicianController],
  providers: [MedicianService, PrismaService],
  exports: [MedicianService],
})
export class MedicianModule {}

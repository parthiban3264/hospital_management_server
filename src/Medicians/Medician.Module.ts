import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { MedicianService } from "./medician.service";
import { MedicianController } from "./medician.controller";

@Module({
  controllers: [MedicianController],
  providers: [MedicianService, PrismaService],
  exports: [MedicianService],
})
export class MedicianModule {}

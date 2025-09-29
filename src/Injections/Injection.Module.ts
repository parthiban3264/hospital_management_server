import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { InjectionService } from "./injection.service";
import { InjectionController } from "./injection.controller";

@Module({
  controllers: [InjectionController],
  providers: [InjectionService, PrismaService],
  exports: [InjectionService],
})
export class InjectionModule {}

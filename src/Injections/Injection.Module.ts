import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { InjectionService } from "./Injection.Service";
import { InjectionController } from "./Injection.controller";

@Module({
  controllers: [InjectionController],
  providers: [InjectionService, PrismaService],
  exports: [InjectionService],
})
export class InjectionModule {}

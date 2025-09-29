import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InjectionService } from "./Injection.Service";
import { InjectionController } from "./Injection.Controller";

@Module({
  controllers: [InjectionController],
  providers: [InjectionService, PrismaService],
  exports: [InjectionService],
})
export class InjectionModule {}

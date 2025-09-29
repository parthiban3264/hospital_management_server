import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RoomsAvailableService } from "./rooms-available.service";
import { RoomsAvailableController } from "./rooms-available.controller";

@Module({
  controllers: [RoomsAvailableController],
  providers: [RoomsAvailableService, PrismaService],
    exports: [RoomsAvailableService],
})
export class RoomsAvailableModule {}

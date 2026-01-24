import { Module } from "@nestjs/common";
import { AAScanAndTestingService } from "./a_a_scan_and_testing.service";
import { AAScanAndTestingController } from "./a_a_scan_and_testing.controller";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [AAScanAndTestingController],
  providers: [AAScanAndTestingService, PrismaService],

})
export class AAScanAndTestingModule {}

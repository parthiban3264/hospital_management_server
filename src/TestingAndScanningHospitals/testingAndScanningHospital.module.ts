import { Module } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { TestingAndScanningHospitalService } from "./testingAndScanningHospital.service";
import { TestingAndScanningHospitalController } from "./testingAndScanningHospital.controller";

@Module({
  controllers: [TestingAndScanningHospitalController],
  providers: [TestingAndScanningHospitalService, PrismaService],
    exports: [TestingAndScanningHospitalService],
})
export class TestingAndScanningHospitalModule {}

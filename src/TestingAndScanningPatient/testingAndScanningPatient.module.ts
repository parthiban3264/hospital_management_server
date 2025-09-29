import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { TestingAndScanningPatientService } from "./testingAndScanningPatient.service";
import { TestingAndScanningPatientController } from "./testingAndScanningPatient.controller";

@Module({
  controllers: [TestingAndScanningPatientController],
  providers: [TestingAndScanningPatientService, PrismaService],
    exports: [TestingAndScanningPatientService],
})
export class TestingAndScanningPatientModule {}

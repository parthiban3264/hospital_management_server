// import { Module } from '@nestjs/common';
// import { PatientController } from './patient.controller';
// import { PrismaService } from '../prisma/prisma.service';
// import { PatientService } from './PatientService';

// @Module({
//   controllers: [PatientController],
//   providers: [PatientService, PrismaService],
// })
// export class PatientModule {}
import { Module } from '@nestjs/common';

import { PatientController } from './patient.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PatientService } from './patientservice';

@Module({
  controllers: [PatientController],
  providers: [PatientService, PrismaService],
  exports: [PatientService], // optional, only if other modules need it
})
export class PatientModule {}

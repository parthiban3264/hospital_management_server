import { Module } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { AdmissionController } from './admission.controller';
import { AdmissionServiceCron } from './daily-billing.crons';

@Module({
  controllers: [AdmissionController],
  providers: [AdmissionService,AdmissionServiceCron],
})
export class AdmissionModule {}

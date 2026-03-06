import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { log } from 'console';
import { PrescriptionService } from './prescription.service';
import { TimeSlot } from '@prisma/client';

@Injectable()
export class PrescriptionServiceCron {
  constructor(private readonly PrescriptionService: PrescriptionService) {}

  @Cron('0 11 * * *') // 11 AM
  async handleMorningUpdate() {
    await this.PrescriptionService.updateExpiredMedicineAdministrations(
      TimeSlot.MORNING,
    );
  }

  @Cron('0 16 * * *') // 4 PM
  async handleAfternoonUpdate() {
    await this.PrescriptionService.updateExpiredMedicineAdministrations(
      TimeSlot.AFTERNOON,
    );
  }

  @Cron('0 0 * * *') // 12 AM
  async handleNightUpdate() {
    await this.PrescriptionService.updateExpiredMedicineAdministrations(
      TimeSlot.NIGHT,
    );
  }
}

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsultationService } from '../Consultation.Service';

@Injectable()
export class ConsultationStatusCron {
  constructor(
    private readonly consultationService: ConsultationService,
  ) {}

  // Runs every hour
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async handleAutoAbandoned() {
    await this.consultationService.autoAbandon();
  }
}

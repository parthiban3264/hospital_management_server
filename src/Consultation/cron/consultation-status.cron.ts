import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsultationService } from '../Consultation.Service';

@Injectable()
export class ConsultationStatusCron {
  constructor(
    private readonly consultationService: ConsultationService,
  ) {}

  // Runs every hour
  @Cron(CronExpression.EVERY_2_HOURS)
  async handleAutoAbandoned() {
    await this.consultationService.autoAbandon();
  }
}

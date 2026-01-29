// import { Injectable, Logger } from '@nestjs/common';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { PrismaService } from '../prisma/prisma.service'; // your Prisma instance

// @Injectable()
// export class DailyBillingService {
//   private readonly logger = new Logger(DailyBillingService.name);

//   constructor(private readonly prisma: PrismaService) {}

//   // Runs every day at 7 PM
//   @Cron('0 19 * * *')
//   async handleDailyBilling() {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     this.logger.log(`Daily IPD billing started for ${today.toDateString()}`);

//     try {
//       const admissions = await this.prisma.admission.findMany({
//         where: {
//           status: 'ADMITTED',
//           dischargeTime: null,
//         },
//         include: {
//           bed: { include: { ward: true } },
//         },
//       });

//       for (const admission of admissions) {
//         // Prevent duplicate billing
//         const alreadyBilled = await this.prisma.charge.findFirst({
//           where: {
//             admissionId: admission.id,
//             chargeDate: today,
//           },
//         });

//         if (alreadyBilled) continue;

//         // Get hospital fees
//         const doctorFee = await this.prisma.fees.findFirst({
//           where: { hospital_Id: admission.hospital_Id, type: 'INPATIENT DOCTOR FEE' },
//         });
//         const nurseFee = await this.prisma.fees.findFirst({
//           where: { hospital_Id: admission.hospital_Id, type: 'INPATIENT NURSE FEE' },
//         });

//         await this.prisma.charge.createMany({
//           data: [
//             {
//               admissionId: admission.id,
//               description: 'Room Rent',
//               chargeDate: today,
//               amount: admission.bed.ward.rent,
//               status: 'PENDING',
//             },
//             {
//               admissionId: admission.id,
//               description: 'Doctor Fee',
//               chargeDate: today,
//               amount: doctorFee?.amount ?? 0,
//               status: 'PENDING',
//             },
//             {
//               admissionId: admission.id,
//               description: 'Nurse Fee',
//               chargeDate: today,
//               amount: nurseFee?.amount ?? 0,
//               status: 'PENDING',
//             },
//           ],
//         });

//         this.logger.log(`Daily charges created for admission ${admission.id}`);
//       }

//       this.logger.log('Daily IPD billing completed!');
//     } catch (error) {
//       this.logger.error('Error in daily IPD billing', error);
//     }
//   }
// }

import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdmissionService } from './admission.service';

@Injectable()
export class AdmissionServiceCron {
  constructor(private readonly AdmissionService: AdmissionService) {}

  // Runs every hour
  // @Cron(CronExpression.EVERY_DAY_AT_11AM)
  // async createChargesFromPayments() {
  //   await this.AdmissionService.createChargesFromPayments();
  // }
  
// every day at 11 PM
  //@Cron('*/30 * * * * *')
  @Cron('0 1 * * *')
  async handleDailyCharges() {
    await this.AdmissionService.createChargesFromPayments();
  }

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // async createDailyPayment() {
  //   await this.AdmissionService.createDailyPayment();
  // }

  // 18:40 every day
@Cron('0 40 18 * * *')
async createDailyPayment1840() {
  await this.AdmissionService.createDailyPayment();
}

// 18:50 every day
@Cron('0 50 18 * * *')
async createDailyPayment1850() {
  await this.AdmissionService.createDailyPayment();
}

// 19:00 every day
@Cron('0 0 19 * * *')
async createDailyPayment1900() {
  await this.AdmissionService.createDailyPayment();
}

}

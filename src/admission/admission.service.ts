import { Injectable, BadRequestException,Logger } from '@nestjs/common';

import { AdmissionStatus, ChargeStatus, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


@Injectable()
export class AdmissionService {
   private readonly logger = new Logger(AdmissionService.name);
  async changeAssignment(
    admissionId: number,
    data: { newBedId?: number },
    hospital_Id: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: { id: admissionId, hospital_Id },
        include: {
          bed: { include: { ward: true } },
        },
      });

      if (!admission) {
        throw new BadRequestException('Admission not found');
      }

      if (!data.newBedId || data.newBedId === admission.bedId) {
        return admission;
      }

      const newBed = await tx.bed.findFirst({
        where: { id: data.newBedId, status: 'AVAILABLE' },
        include: { ward: true },
      });

      if (!newBed) {
        throw new BadRequestException('Selected bed not available');
      }

      const now = new Date();

      // ✅ Preserve existing history
      const wardHistory: any[] = Array.isArray(admission.wardChange)
        ? [...admission.wardChange]
        : [];

      // ✅ Add new movement entry
      wardHistory.push({
        movedAt: now.toISOString(),
        fromWard: {
          wardId: admission.bed.ward.id,
          wardName: admission.bed.ward.name,
          bedId: admission.bed.id,
          bedNo: admission.bed.bedNo,
        },
        toWard: {
          wardId: newBed.ward.id,
          wardName: newBed.ward.name,
          bedId: newBed.id,
          bedNo: newBed.bedNo,
        },
      });

      // 🔄 Free old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // 🔒 Occupy new bed
      await tx.bed.update({
        where: { id: newBed.id },
        data: { status: 'OCCUPIED' },
      });

      // 💾 Save updated history
      return tx.admission.update({
        where: { id: admissionId },
        data: {
          bedId: newBed.id,
          wardChange: wardHistory,
        },
        include: {
          patient: true,
          bed: { include: { ward: true } },
        },
      });
    });
  }

  async findById(id: number, hospital_Id: number) {
    return prisma.patient.findFirst({
      where: {
        id,
        hospital_Id,
      },
    });
  }

  async findAllPatients(hospital_Id: number) {
    return prisma.patient.findMany({
      where: {
        hospital_Id,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getAdmittedAdmissions(hospital_Id: number) {
    return prisma.admission.findMany({
      where: {
        hospital_Id,
        status: 'ADMITTED',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        bed: {
          include: {
            ward: true,
          },
        },
      },
      orderBy: {
        admitTime: 'desc',
      },
    });
  }

  async admitPatient(dto: any, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      // 🔴 Required fields
      if (!dto.patientId || !dto.bedId) {
        throw new BadRequestException('Patient and Bed are required');
      }

      // 🔍 Ensure patient exists (read-only)
      const patient = await tx.patient.findFirst({
        where: {
          hospital_Id,
          id: dto.patientId,
        },
        select: { id: true },
      });

      if (!patient) {
        throw new BadRequestException('Patient not found');
      }

      // 🚫 Prevent multiple active admissions
      const existingAdmission = await tx.admission.findFirst({
        where: {
          patient_Id: dto.patientId,
          hospital_Id,
          status: 'ADMITTED',
        },
        select: { id: true },
      });

      if (existingAdmission) {
        throw new BadRequestException('Patient already admitted');
      }

      // 🛏 Bed availability check
      const bed = await tx.bed.findFirst({
        where: {
          id: dto.bedId,
          status: 'AVAILABLE',
        },
      });

      const wardAmount = await tx.wards.findFirst({
        where: {
          id: bed.wardId,
        },
      });

      if (!bed) {
        throw new BadRequestException('Bed not available');
      }

      // 🏥 Create admission
      const admission = await tx.admission.create({
        data: {
          hospital_Id,
          patient_Id: dto.patientId,
          bedId: dto.bedId,
          attenderDetail: dto.admitBy ?? null,
        },
      });

      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      const now = new Date();
      const billingStartDate = new Date(now);
      if (now.getHours() >= 19) {
        billingStartDate.setDate(billingStartDate.getDate() + 1);
      }
      billingStartDate.setHours(0, 0, 0, 0);
      if (dto.isAdvanced === true) {
        const advancedFee = await prisma.fees.findFirst({
          where: {
            hospital_Id: Number(hospital_Id),
            type: 'INPATIENT ADVANCE FEE',
          },
        });
        const hasValidAdvanceFee =
          advancedFee !== null && advancedFee.amount > 0;

        if (!hasValidAdvanceFee) {
          throw new BadRequestException('Please Set Inpatient Advanced Fee');
        }
        await tx.charge.create({
          data: {
            admissionId: admission.id,
            description: 'Inpatient Advance Fee',
            chargeDate: billingStartDate,
            amount: advancedFee.amount,
            status: 'PENDING',
          },
        });
        const payment = await tx.payment.create({
          data: {
            hospital_Id: hospital_Id,
            patient_Id: dto.patientId,
            //consultation_Id: consultation.id,
            admission_Id: admission.id,
            reason: 'Inpatient Advance Fee',
            status: 'PENDING',
            amount: advancedFee?.amount ?? 0,
            type: 'ADVANCEFEE',
            createdAt: dto.createdAt || new Date(),
          },
          include: {
            Admission: {
              include: { charges: true },
            },
          },
        });
      }
      const DoctorFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: Number(hospital_Id),
          type: 'INPATIENT DOCTOR FEE',
        },
      });
      const NurseFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: Number(hospital_Id),
          type: 'INPATIENT NURSE FEE',
        },
      });
      await prisma.charge.createMany({
        data: [
          {
            admissionId: admission.id,
            description: 'Room Rent',
            chargeDate: billingStartDate,
            amount: wardAmount.rent,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Doctor Fee',
            chargeDate: billingStartDate,
            amount: DoctorFee.amount ?? 0,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Nurse Fee',
            chargeDate: billingStartDate,
            amount: NurseFee.amount ?? 0,
            status: 'PENDING',
          },
        ],
      });

      // 🔒 Occupy bed
      await tx.bed.update({
        where: { id: dto.bedId },
        data: { status: 'OCCUPIED' },
      });

      // 📦 Return admission
      return tx.admission.findUnique({
        where: { id: admission.id },
        include: {
          patient: true,
          bed: {
            include: { ward: true },
          },
          payments: true,
        },
      });
    });
  }

  // async handleDailyBilling() {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //    this.logger.log(`Daily IPD billing started for ${today.toDateString()}`);

  //   try {
  //     const admissions = await prisma.admission.findMany({
  //       where: {
  //         status: 'ADMITTED',
  //         dischargeTime: null,
  //       },
  //       include: {
  //         bed: { include: { ward: true } },
  //       },
  //     });

  //     for (const admission of admissions) {
  //       // Prevent duplicate billing
  //       const alreadyBilled = await prisma.charge.findFirst({
  //         where: {
  //           admissionId: admission.id,
  //           chargeDate: today,
  //         },
  //       });

  //       if (alreadyBilled) continue;

  //       // Get hospital fees
  //       const doctorFee = await prisma.fees.findFirst({
  //         where: { hospital_Id: admission.hospital_Id, type: 'INPATIENT DOCTOR FEE' },
  //       });
  //       const nurseFee = await prisma.fees.findFirst({
  //         where: { hospital_Id: admission.hospital_Id, type: 'INPATIENT NURSE FEE' },
  //       });

  //       await prisma.charge.createMany({
  //         data: [
  //           {
  //             admissionId: admission.id,
  //             description: 'Room Rent',
  //             chargeDate: today,
  //             amount: admission.bed.ward.rent,
  //             status: 'PENDING',
  //           },
  //           {
  //             admissionId: admission.id,
  //             description: 'Doctor Fee',
  //             chargeDate: today,
  //             amount: doctorFee?.amount ?? 0,
  //             status: 'PENDING',
  //           },
  //           {
  //             admissionId: admission.id,
  //             description: 'Nurse Fee',
  //             chargeDate: today,
  //             amount: nurseFee?.amount ?? 0,
  //             status: 'PENDING',
  //           },
  //         ],
  //       });

  //       this.logger.log(`Daily charges created for admission ${admission.id}`);
  //     }

  //     this.logger.log('Daily IPD billing completed!');
  //   } catch (error) {
  //     this.logger.error('Error in daily IPD billing', error);
  //   }
  // }

async createChargesFromPayments() {
  // const yesterday = new Date();
  // yesterday.setDate(yesterday.getDate() - 1);
  // yesterday.setHours(0, 0, 0, 0);
  const today = new Date().toISOString().split('T')[0];

  const payments = await prisma.payment.findMany({
    where: {
      type: 'DAILYTREATMENTFEE',
      Admission: {
        status: 'ADMITTED',
        dischargeTime: null,
      },
    },
    include: {
      Admission: {
        include: {
          bed: {
            include: {
              ward: true,
            },
          },
        },
      },
    },
  });

  for (const payment of payments) {
    const admission = payment.Admission;
    if (!admission) continue;

    // avoid duplicate charges for same day
    const exists = await prisma.charge.findFirst({
      where: {
        admissionId: admission.id,
        chargeDate: today,
      },
    });

    if (exists) continue;

    const doctorFee = await prisma.fees.findFirst({
      where: {
        hospital_Id: admission.hospital_Id,
        type: 'INPATIENT DOCTOR FEE',
      },
    });

    const nurseFee = await prisma.fees.findFirst({
      where: {
        hospital_Id: admission.hospital_Id,
        type: 'INPATIENT NURSE FEE',
      },
    });

    await prisma.charge.createMany({
      data: [
        {
          admissionId: admission.id,
          description: 'Room Rent',
          chargeDate: today,
          amount: admission.bed.ward.rent,
          status: 'PENDING',
        },
        {
          admissionId: admission.id,
          description: 'Doctor Fee',
          chargeDate: today,
          amount: doctorFee?.amount ?? 0,
          status: 'PENDING',
        },
        {
          admissionId: admission.id,
          description: 'Nurse Fee',
          chargeDate: today,
          amount: nurseFee?.amount ?? 0,
          status: 'PENDING',
        },
      ],
    });
  }
}


async createDailyPayment() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const admissions = await prisma.admission.findMany({
    where: {
      status: 'ADMITTED',
      dischargeTime: null,
    },
  });

  for (const admission of admissions) {

    // ⛔ prevent duplicate daily payment
    const exists = await prisma.payment.findFirst({
      where: {
        admission_Id: admission.id,
        type: 'DAILYTREATMENTFEE',
        //billingDate: today,
      },
    });

    if (exists) continue;

    // ✅ get today's charges
    const charges = await prisma.charge.findMany({
      where: {
        admissionId: admission.id,
        chargeDate: today,
      },
    });

    if (charges.length === 0) continue; // no charges → no bill

    const totalAmount = charges.reduce(
      (sum, c) => sum + c.amount,
      0,
    );

    // ✅ create PAYMENT from charges total
    await prisma.payment.create({
      data: {
        hospital_Id: admission.hospital_Id,
        patient_Id: admission.patient_Id,
        admission_Id: admission.id,
        reason: `IPD Daily Bill`,
        amount: totalAmount,
        status: 'PENDING',
        type: 'DAILYTREATMENTFEE',
        //billingDate: today,
        createdAt: new Date().toDateString(),
      },
    });
  }
}



  async getNurses(hospital_Id: number) {
    return prisma.admin.findMany({
      where: { hospital_Id, role: 'NURSE', status: 'ACTIVE' },
    });
  }

  async getDoctors(hospital_Id: number) {
    return prisma.admin.findMany({
      where: { hospital_Id, role: 'DOCTOR', status: 'ACTIVE' },
    });
  }

  getAllAdmissions(hospital_Id: number) {
    return prisma.admission.findMany({
      include: {
        patient: true,
        bed: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAdmissionById(id: number, hospital_Id: number) {
    return prisma.admission.findUnique({
      where: { id, hospital_Id },
      include: {
        patient: true,
        bed: true,
      },
    });
  }

  async updateAdmission(id: number, data: any, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.update({
        where: { id, hospital_Id },
        data,
        include: {
          patient: true,
          bed: true,
        },
      });

      if (data.status === 'DISCHARGED') {
        await tx.bed.update({
          where: { id: admission.bedId },
          data: { status: 'AVAILABLE' },
        });
      }

      return admission;
    });
  }

  async findByPhone(phone: string, hospital_Id: number) {
    return prisma.patient.findMany({
      where: {
        hospital_Id,
        user_Id: phone,
        // phone: {
        //   path: '$',
        //   array_contains: phone,
        // },
      },
    });
  }

  async updateStatus(admissionId: number, dto: { status: AdmissionStatus }) {
    return prisma.$transaction([
      prisma.admission.update({
        where: { id: admissionId },
        data: {
          status: dto.status,
          updatedAt: new Date(),
        },
      }),
      prisma.charge.updateMany({
        where: { admissionId },
        data: {
          status: ChargeStatus.CANCELLED,
          updatedAt: new Date(),
        },
      }),
    ]);
  }

  async deleteAdmission(id: number, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.delete({
        where: { id, hospital_Id },
      });

      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      return admission;
    });
  }
}

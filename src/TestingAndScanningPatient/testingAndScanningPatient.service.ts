import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TestingAndScanningPatientService {
  constructor(private prisma: PrismaService) {}

  // async create(data: any) {
  //   const [test, payment] = await this.prisma.$transaction([
  //     this.prisma.testingAndScanningPatient.create({
  //       data: {
  //         hospital_Id: data.hospital_Id,
  //         patient_Id: data.patient_Id,
  //         doctor_Id: data.doctor_Id,
  //         staff_Id: data.staff_Id,
  //         title: data.title,
  //         scheduleDate: new Date(data.scheduleDate),
  //         type: data.type,
  //         selectedOptions: data.selectedOptions,
  //         status: data.status,
  //         paymentStatus: data.paymentStatus,
  //         result: data.result,
  //         createdAt: data.createdAt,
  //       },
  //     }),
  //     this.prisma.payment.create({
  //       data: {
  //         hospital_Id: data.hospital_Id,
  //         patient_Id: data.patient_Id,
  //         reason: 'Testing & Scanning Fee',
  //         status: 'PENDING',
  //         amount: data.amount,
  //         type: 'TESTINGFEESANDSCANNINGFEE',
  //         createdAt: data.createdAt,
  //       },
  //     }),
  //   ]);

  //   return { test, payment };
  // }
  async create(data: any) {
  return this.prisma.$transaction(async (tx) => {
    // Step 1: Find an existing PENDING payment for the same patient in the same hospital
    let payment = await tx.payment.findFirst({
      where: {
        hospital_Id: data.hospital_Id,
        patient_Id: data.patient_Id,
        type: 'TESTINGFEESANDSCANNINGFEE', // match your logic
        status: 'PENDING',
      },
    });

    // Step 2: Create or update payment
    if (payment) {
      payment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          amount: (payment.amount ?? 0) + (data.amount ?? 0),
          updatedAt: data.createdAt,
        },
      });
    } else {
      payment = await tx.payment.create({
        data: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          reason: 'Testing & Scanning Fee',
          status: 'PENDING',
          amount: data.amount,
          type: 'TESTINGFEESANDSCANNINGFEE',
          createdAt: data.createdAt,
        },
      });
    }

    // Step 3: Create new test linked to that payment
    const test = await tx.testingAndScanningPatient.create({
      data: {
        hospital_Id: data.hospital_Id,
        patient_Id: data.patient_Id,
        doctor_Id: data.doctor_Id,
        staff_Id: data.staff_Id,
        title: data.title,
        scheduleDate: new Date(data.scheduleDate),
        type: data.type,
        selectedOptions: data.selectedOptions,
        status: data.status,
        paymentStatus: data.paymentStatus,
        result: data.result,
        createdAt: data.createdAt,
        payment_Id: payment.id, // link to the same payment
      },
    });

    return { test, payment };
  });
}
async updateTestingAndScanningByPayment(paymentId: number) {
    const result = await this.prisma.testingAndScanningPatient.updateMany({
      where: { payment_Id: Number(paymentId) },
      data: { paymentStatus: true },
    });

    // Return simple success + how many records were updated
    return {
      success: true,
      message: `Updated ${result.count} testing & scanning records successfully.`,
    };
  }
//await prisma.testingAndScanningPatient.updateMany({
//   where: { payment_Id: paymentId },
//   data: { paymentStatus: true },
// });


  async findAll() {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      include: { Hospital: true, Patient: true },
    });
    return { status: 'success', message: 'Records fetched', data: records };
  }
  async findAllTestandScanByType(hospital_Id: number, type: string) {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      where: {
        hospital_Id: Number(hospital_Id),
        type: type.toUpperCase(),
        status: {
          in: ['PENDING'],
        },
        paymentStatus: true,
      },
      include: { Hospital: {
        select: {Admins: {select: {id: true,user_Id:true, name: true}},id:true, name: true,address: true,}, 
    },
    Patient: {
      include:{Consultation:true}
    },
    },
    });
    return { status: 'success', message: 'Records fetched', data: records };
  }

  async finfindAllTestandScan(hospital_Id: number) {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      where: {
        hospital_Id: Number(hospital_Id),
      },
      include: { Hospital: true,
    Patient: {
      include:{Consultation:true}
    },
    },
    });
    return { status: 'success', message: 'Records fetched', data: records };
  }

  async findOne(id: number) {
    const record = await this.prisma.testingAndScanningPatient.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: 'success', message: 'Record fetched', data: record };
  }

  async update(id: number, data: any) {
    try {
      const record = await this.prisma.testingAndScanningPatient.update({
        where: { id },
        data,
      });
      return { status: 'success', message: 'Record updated', data: record };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const record = await this.prisma.testingAndScanningPatient.delete({
        where: { id },
      });
      return { status: 'success', message: 'Record deleted', data: record };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

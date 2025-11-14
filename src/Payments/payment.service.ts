import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          hospital_Id: Number(data.hospital_Id),
          staff_Id: data.staff_Id,
          patient_Id: data.patient_Id,
          reason: data.reason,
          status: data.status,
          amount: data.amount,
          consultation_Id: data.consultation_Id,
          transactionId: data.transactionId,
          billingId: data.billingId,
          type: data.type,
          createdAt: data.createdAt || new Date().toISOString(),
        },
      });
      return { status: "success", message: "Payment created", data: payment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
async findPendingPaymentsByHospital(hospitalId: number) {
  return this.prisma.payment.findMany({
    where: {
      hospital_Id: Number(hospitalId),
      status: {
        in: ['PENDING'], // Only pending or ongoing payments
      },
      NOT: {type: 'MEDICINETONICINJECTIONFEES' },
    },
    include: {
      Hospital: {select: {id:true ,name: true,}},
      Patient: {select: {user_Id: true, name:true, dob:true, gender:true,phone:true,address:true,createdAt:true,},},
      Consultation: {select:{ id : true ,doctor_Id:true,patient_Id:true,} },
      TestingAndScanningPatients: {select: { id: true, title: true, type: true, status: true,payment_Id:true, consultation_Id: true, },},
    },
    orderBy: {
      createdAt: 'asc', // Sort by creation date
    },
  });
}

// async findPendingPaidByHospital(hospitalId: number) {
//   return this.prisma.payment.findMany({
//     where: {
//       hospital_Id: Number(hospitalId),
//       status: {
//         in: ['PAID'], // Only pending or ongoing payments
//       },
//     },
//     include: {
//       Hospital: true,
//       Patient: true,
//       Consultation: true,
//     },
//     orderBy: {
//       createdAt: 'asc', // Sort by creation date
//     },
//   });
// }

async findPendingPaidByHospital(hospitalId: number) {
  return this.prisma.payment.findMany({
    where: {
      hospital_Id: Number(hospitalId),
      status: 'PAID',
      Patient: {
        Consultation: {
          some: {
            symptoms: false,
            paymentStatus: true,
            status: 'PENDING',
          },
        },
      },
    },
    include: {
      Hospital: true,
      Patient: {
        include: {
          Consultation: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}


  async findAll(hospital: number) {
    const payments = await this.prisma.payment.findMany({
      where: { hospital_Id: Number(hospital) },
    });
    return { status: "success", message: "Payments fetched", data: payments };
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!payment) throw new NotFoundException(`Payment with ID ${id} not found`);
    return { status: "success", message: "Payment fetched", data: payment };
  }

  async update(id: number, data: any) {
  try {
    const payment = await this.prisma.payment.update({
      where: { id },
      data,
    });

    // if (payment.hospital_Id !== hospitalId) {
    //   return { status: "failed", message: "Hospital mismatch" };
    // }

    return { status: "success", message: "Payment updated", data: payment };
  } catch (error) {
    console.error(error);
    if (error.code === 'P2025') {
      return { status: "failed", message: "Payment not found" };
    }
    return { status: "failed", error: error.message };
  }
}
  async remove(id: number) {
    try {
      const payment = await this.prisma.payment.delete({ where: { id } });
      return { status: "success", message: "Payment deleted", data: payment };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

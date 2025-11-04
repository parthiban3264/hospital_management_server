import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultationGateway } from './consultation.gateway';
import { QueueStatus } from '@prisma/client';

@Injectable()
export class ConsultationService {
  constructor(private prisma: PrismaService,
    private gateway: ConsultationGateway,
  ) {}

  // async create(data: any) {
  //   try {
  //     const consultation = await this.prisma.consultation.create({
  //       data,
  //     });
  //     return { status: "success", message: "Consultation created", data: consultation };
  //   } catch (error) {
  //     return { status: "failed", error: error.message };
  //   }
  // }

  async create(data: any) {
  try {
    console.log('Creating consultation with data:', data);

    // Step 1️⃣ - Create consultation
    const consultation = await this.prisma.consultation.create({
      data: {
        hospital_Id: Number(data.hospital_Id),
        patient_Id: data.patient_Id,
        doctor_Id: data.doctor_Id,
        purpose: data.purpose,
        symptoms: data.symptoms,
        notes: data.notes ? JSON.parse(data.notes) : null,
        paymentStatus: data.paymentStatus === true,
        createdAt: data.createdAt || new Date().toISOString(),
      },
    });

    // Step 2️⃣ - Create payment linked to consultation
    const payment = await this.prisma.payment.create({
      data: {
        hospital_Id: Number(data.hospital_Id),
        patient_Id: data.patient_Id,
        consultation_Id: consultation.id, // ✅ works now
        reason: data.title ?? 'Registration Fee',
        status: 'PENDING',
        amount: data.amount ?? 500,
        type: 'REGISTRATIONFEE',
        createdAt: data.createdAt || new Date().toISOString(),
      },
    });

    // Step 3️⃣ - Return response
    return {
      status: 'success',
      data: {
        consultationId: consultation.id,
        paymentId: payment.id,
      },
    };
  } catch (e) {
    console.error(e);
    return { status: 'failed', error: e.message };
  }
}


  async findAll() {
    const consultations = await this.prisma.consultation.findMany({
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
      },
    });
    return {
      status: 'success',
      message: 'Consultations fetched',
      data: consultations,
    };
  }

  async findAllByHospital(hospitalId: number) {
    return this.prisma.consultation.findMany({
      where: { hospital_Id: Number(hospitalId),status: {in: ['PENDING','ENDPROCESSING','ONGOING']} }, // assuming hospitalId is numeric
      include: {
        Hospital: true,
        Patient: {
          include: {
            TestingAndScanning: true,
          },
        },
        Doctor: true,
      },
    });
  }

async findAllByMedical(hospitalId: number) {
  return this.prisma.consultation.findMany({
    where: { 
      hospital_Id: Number(hospitalId),
      status: { in: ['ENDPROCESSING', 'ONGOING'] },
      medicineTonic: true,
    },
    include: {
      Hospital: true,
      Patient: true,
      MedicinePatient: {
        include: {
          Medician: true, 
          Payment: true,
        },
      },
      InjectionPatient: {
        include: {
          Injection: true, 
          Payment: true, 
        },
      },
      TonicPatient: {
        include: {
          Tonic: true,
          Payment: true,
        },
      },
      Doctor: true,
    },
  });
}


  async findByHospitalDoctor(hospitalId: number, doctorId: string) {
    return this.prisma.consultation.findMany({
      where: { hospital_Id: Number(hospitalId), doctor_Id: doctorId }, // assuming hospitalId is numeric
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
      },
    });
  }
  async findOne(id: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Doctor: true },
    });

    if (!consultation)
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    return {
      status: 'success',
      message: 'Consultation fetched',
      data: consultation,
    };
  }

  async update(id: number, data: any) {
    try {
      const consultation = await this.prisma.consultation.update({
        where: { id },
        data,
      });
      return {
        status: 'success',
        message: 'Consultation updated',
        data: consultation,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
async updateQueueStatus(id: number, queueStatus: QueueStatus) {
  const updated = await this.prisma.consultation.update({
    where: { id },
    data: { queueStatus },
  });

  this.gateway.sendQueueStatusUpdate(updated.id, updated.queueStatus);
  return updated;
}

  //   async update(id: number, data: any) {
  //   try {
  //     const consultation = await this.prisma.consultation.update({
  //       where: { id },
  //       data: {
  //         treatment: data.treatment ?? undefined,
  //         medicineInjection: data.medicineInjection ?? undefined,
  //         scanningTesting: data.testingScanning ?? undefined,
  //         status: data.status ?? undefined,
  //       },
  //     });
  //     return { status: "success", message: "Consultation updated", data: consultation };
  //   } catch (error) {
  //     return { status: "failed", error: error.message };
  //   }
  // }

  async remove(id: number) {
    try {
      const consultation = await this.prisma.consultation.delete({
        where: { id },
      });
      return {
        status: 'success',
        message: 'Consultation deleted',
        data: consultation,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

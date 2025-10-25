import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ConsultationService {
  constructor(private prisma: PrismaService) {}

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
      const consultation = await this.prisma.consultation.create({
        data: {
          hospital_Id: Number(data.hospital_Id), // required for composite relations
          patient_Id: data.patient_Id, // string
          doctor_Id: data.doctor_Id, // string
          purpose: data.purpose,
          symptoms: data.symptoms,
          notes: data.notes ? JSON.parse(data.notes) : null,
          paymentStatus: data.paymentStatus === true,
          createdAt: data.createdAt || new Date().toISOString(),
        },
      });
      return { status: 'success', data: consultation };
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

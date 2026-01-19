import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdmissionService {

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
    const payment = await tx.payment.create({
       data: {
            hospital_Id: hospital_Id,
            patient_Id: dto.patientId,
            //consultation_Id: consultation.id,

            reason: 'Admission Fee',
            status: 'PENDING',
            amount: wardAmount.rent,
            type: 'ADMISSIONFEE',
            createdAt: dto.createdAt || new Date(),
          },
          include:{
            Admission:{
              include:{charges:true}
            }
          }
    })

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
        payments:true,
      },
    });
  });
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

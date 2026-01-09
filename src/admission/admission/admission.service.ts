import { Injectable ,BadRequestException} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class AdmissionService {

  // admission.service.ts
async changeAssignment(
  admissionId: number,
  data: {
    doctorId?: number;
    nurseId?: number;
    newBedId?: number;
  },
  hospital_Id:number
) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUnique({
      where: { id: admissionId },
    });

    if (!admission) {
      throw new BadRequestException('Admission not found');
    }

    const updateData: any = {};

    // 👨‍⚕️ Change doctor
    if (data.doctorId) {
      updateData.oldDoctorDetail = admission.doctorId;
      updateData.doctorId = data.doctorId;
    }

    // 👩‍⚕️ Change nurse
    if (data.nurseId) {
      updateData.nurseId = data.nurseId;
    }

    // 🛏 Change bed
    if (data.newBedId && data.newBedId !== admission.bedId) {
      const newBed = await tx.bed.findUnique({
        where: { id: data.newBedId },
      });

      if (!newBed || newBed.status !== 'AVAILABLE') {
        throw new BadRequestException('Selected bed not available');
      }

      // Free old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // Occupy new bed
      await tx.bed.update({
        where: { id: data.newBedId },
        data: { status: 'OCCUPIED' },
      });

      updateData.bedId = data.newBedId;
      updateData.wardChange = {
        fromBed: admission.bedId,
        toBed: data.newBedId,
        changedAt: new Date(),
      };
    }

    return tx.admission.update({
      where: { id: admissionId },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        nurse: true,
        bed: { include: { ward: true } },
      },
    });
  });
}

  async getAdmittedAdmissions(hospital_Id:number) {
  return prisma.admission.findMany({
    where: {
      status: 'ADMITTED',
      hospital_Id
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

  async admitPatient(dto: any) {
  return prisma.$transaction(async (tx) => {

    let patientId: number;

    // ✅ CASE 1: Patient already selected (frontend sends ID)
    if (dto.patientId) {
      patientId = dto.patientId;
    }
    // ✅ CASE 2: Create new patient
    else {
      const patient = await tx.patient.create({
        data: {
          hospital_Id :dto.hospital_Id,
          staff_Id: dto.patient.staff_Id ?? null,
          name: dto.patient.name,
          phone: dto.patient.phone,
          email: dto.patient.email ?? null,
          gender: dto.patient.gender,
          dob: new Date(dto.patient.dob),
          address: dto.patient.address,
        },
      });
      patientId = patient.id;
    }

    // 🛏 Validate bed
    const bed = await tx.bed.findUnique({
      where: { id: dto.bedId },
    });

    if (!bed || bed.status !== 'AVAILABLE') {
      throw new BadRequestException('Bed not available');
    }

    // 🏥 Create admission
    const admission = await tx.admission.create({
      data: {
        hospital_Id :dto.hospital_Id,
        patient_Id : patientId,
        reason:dto.reason,
        doctorId: dto.doctorId,
        nurseId: dto.nurseId,
        bedId: dto.bedId,
        attenderDetail: dto.admitBy ?? null,
      },
    });

    // 🔒 Occupy bed
    await tx.bed.update({
      where: { id: dto.bedId },
      data: { status: 'OCCUPIED' },
    });

    return admission;
  });
}

  async getNurses(hospital_Id:number) {
    return prisma.admin.findMany({
      where: { role: 'Nurse', status: 'ACTIVE',hospital_Id },
    });
  }

  async getDoctors(hospital_Id:number) {
    return prisma.admin.findMany({
      where: { role: 'Doctor', status: 'ACTIVE',hospital_Id },
    });
  }

  async createAdmission(data: any) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.create({
      data,
      include: {
        patient: true,
        doctor: true,
        nurse: true,
        bed: true,
      },
    });

    await tx.bed.update({
      where: { id: data.bedId },
      data: { status: 'OCCUPIED' },
    });

    return admission;
  });
}

  getAllAdmissions(hospital_Id:number) {
    return prisma.admission.findMany({
      include: {
        patient: true,
        doctor: true,
        nurse: true,
        bed: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get admission by ID
  getAdmissionById(id: number,hospital_Id:number) {
    return prisma.admission.findUnique({
      where: { id,hospital_Id },
      include: {
        patient: true,
        doctor: true,
        nurse: true,
        bed: true,
      },
    });
  }

  // Update Admission
async updateAdmission(id: number, data: any,hospital_Id:number) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.update({
      where: { id ,hospital_Id},
      data,
      include: {
        patient: true,
        doctor: true,
        nurse: true,
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

async findByPhone(phone: string,hospital_Id:number) {
  return prisma.patient.findMany({
    where: {
      hospital_Id,
      user_Id : phone
      // phone: {
      //   path: '$',
      //   array_contains: phone,
      // },
    },
  });
}

  // Delete Admission
async deleteAdmission(id: number,hospital_Id:number) {
  return prisma.$transaction(async (tx) => {
    const admission = await tx.admission.delete({
      where: { id,hospital_Id },
    });

    await tx.bed.update({
      where: { id: admission.bedId },
      data: { status: 'AVAILABLE' },
    });

    return admission;
  });
}

}

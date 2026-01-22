import { Injectable, BadRequestException } from '@nestjs/common';
import { ChargeStatus, PrismaClient } from '@prisma/client';
import { CreateChargeDto } from './dto/create-charge.dto';

const prisma = new PrismaClient();

@Injectable()
export class ChargesService {
  // async create(dto: CreateChargeDto) {
  //   // 🔒 Allow only ADMITTED admissions
  //   const admission = await prisma.admission.findFirst({
  //     where: {
  //       id: dto.admissionId,
  //       status: 'ADMITTED',
  //     },
  //   });

  //   if (!admission) {
  //     throw new BadRequestException('Admission not active');
  //   }

  //   return prisma.charge.create({
  //     data: {
  //       admissionId: dto.admissionId,
  //       description: dto.description,
  //       amount: dto.amount,
  //     },
  //   });
  // }
  async create(dto: CreateChargeDto) {
    // 1️⃣ Allow only ADMITTED admissions
    const admission = await prisma.admission.findFirst({
      where: {
        id: dto.admissionId,
        status: 'ADMITTED',
      },
    });

    if (!admission) {
      throw new BadRequestException('Admission not active');
    }

    // 2️⃣ Create charge
    const charge = await prisma.charge.create({
      data: {
        admissionId: dto.admissionId,
        description: dto.description,
        amount: dto.amount,
        status: 'PENDING',
      },
    });

    // 3️⃣ Find existing payment for admission
    let payment = await prisma.payment.findFirst({
      where: {
        admission_Id: dto.admissionId,
        status: {
          not: 'PAID',
        },
      },
    });
 const status = 'PARTIALLY_PAID' === payment.status ;
    // 5️⃣ Update payment amount + status
    const updatedAmount = Number(payment.amount) + Number(dto.amount);

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        amount: updatedAmount,
        received_Amount: status ? payment.amount : 0,
        status:  'PENDING',
      },
    });

    return charge;
  }

  async findPendingByHospital(hospital_Id: number) {
    // Fetch admissions for hospital
    const admissions = await prisma.admission.findMany({
      where: { hospital_Id },
      include: {
        patient: true,
        bed: { include: { ward: true } },
        charges: { where: { status: 'PENDING' } },
      },
    });

    // Filter out admissions without pending charges
    const pendingAdmissions = admissions
      .filter((adm) => adm.charges.length > 0)
      .map((adm) => ({
        admissionId: adm.id,
        patientName: adm.patient.name,
        wardName: adm.bed.ward.name,
        bedNo: adm.bed.bedNo,
        charges: adm.charges,
      }));

    return pendingAdmissions;
  }

  async update(id: number, dto: CreateChargeDto) {
    return prisma.charge.update({
      where: { id },
      data: {
        description: dto.description,
        amount: dto.amount,
      },
    });
  }

  async updateCharges(dto: { status: ChargeStatus,chargesIds : number }) {
  return prisma.charge.updateMany({
    where: {
      id: dto.chargesIds,
    },
    data: {
      status: dto.status, 
      updatedAt: new Date(),
    },
  });
}


  async remove(id: number) {
    return prisma.charge.delete({
      where: { id },
    });
  }
}

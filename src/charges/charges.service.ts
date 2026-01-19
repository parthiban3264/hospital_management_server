import { Injectable ,BadRequestException} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateChargeDto } from './dto/create-charge.dto';

const prisma = new PrismaClient();

@Injectable()
export class ChargesService {

async create(dto: CreateChargeDto) {
  // 🔒 Allow only ADMITTED admissions
  const admission = await prisma.admission.findFirst({
    where: {
      id: dto.admissionId,
      status: 'ADMITTED',
    },
  });

  if (!admission) {
    throw new BadRequestException('Admission not active');
  }

  return prisma.charge.create({
    data: {
      admissionId: dto.admissionId,
      description: dto.description,
      amount: dto.amount,
    },
  });
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

async remove(id: number) {
  return prisma.charge.delete({
    where: { id },
  });
}
}
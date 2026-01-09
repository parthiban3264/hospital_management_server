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

async findByAdmission(admissionId: number) {
  return prisma.charge.findMany({
    where: { admissionId },
    orderBy: { createdAt: 'desc' },
  });
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
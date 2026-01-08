import { Injectable } from '@nestjs/common';
import { PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()

export class WardService {

  // Create Ward
  createWard(data: { name: string; type: string ,hospital_Id:number}) {
    return prisma.ward.create({ data });
  }

  // Get All Wards
  getAllWards(hospital_Id: number) {
    return prisma.ward.findMany({
      where: { hospital_Id },
      include: { beds: true },
    });
  }

  // Get Ward by ID
  getWardById(id: number, hospital_Id: number) {
    return prisma.ward.findUnique({
      where: { id, hospital_Id },
      include: { beds: true },
    });
  }

  // Update Ward
  updateWard(id: number, data: { name?: string; type?: string, }, hospital_Id: number) {
    return prisma.ward.update({
      where: { id, hospital_Id },
      data,
    });
  }

  // Delete Ward
  deleteWard(id: number, hospital_Id: number) {
    return prisma.ward.delete({
      where: { id, hospital_Id },
    });
  }

  // Create Bed
  createBed(wardId: number, bedNo: number, hospital_Id: number) {
    return prisma.bed.create({
      data: {
        bedNo,
        wardId,
        hospital_Id,
      },
    });
  }

  async updateWardWithBeds(
  id: number,
  data: {
    name?: string;
    type?: string;
    beds?: {
      id: number;
      bedNo?: number;
      status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    }[];
  },
  hospital_Id: number
) {
  return prisma.$transaction(async (tx) => {
    // Update ward
    await tx.ward.update({
      where: { id, hospital_Id },
      data: {
        name: data.name,
        type: data.type,
      },
    });

    // Update beds
    if (data.beds?.length) {
      for (const bed of data.beds) {
        await tx.bed.update({
          where: { id: bed.id },
          data: {
            bedNo: bed.bedNo,
            status: bed.status,
          },
        });
      }
    }

    return tx.ward.findUnique({
      where: { id },
      include: { beds: true },
    });
  });
}

  // Update Bed Status
// Update Bed (number + status)
updateBed(
  id: number,
  data: { bedNo?: number; status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' },
  hospital_Id: number
) {
  return prisma.bed.update({
    where: { id,hospital_Id },
    data,
  });
}


  // Delete Bed
  deleteBed(id: number, hospital_Id: number) {
    return prisma.bed.delete({
      where: { id,hospital_Id },
    });
  }
}
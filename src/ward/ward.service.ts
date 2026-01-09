import { Injectable } from '@nestjs/common';
import { PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()

export class WardService {

async createWard(
  data: { name: string; type: string; beds: any[] },
  hospital_Id: number
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create ward
    const ward = await tx.ward.create({
      data: {
        hospital_Id,
        name: data.name,
        type: data.type,
      },
    });

    // 2. Create beds
    if (data.beds?.length) {
      await tx.bed.createMany({
        data: data.beds.map((bed) => ({
          bedNo: bed.bedNo,
          wardId: ward.id,
          status: bed.status ?? 'AVAILABLE',
        })),
      });
    }

    return ward;
  });
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

 async deleteWard(id: number, hospital_Id: number) {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete all beds in the ward
     tx.bed.deleteMany({
      where: {
        wardId: id,
      },
    });

    // 2. Delete the ward
    return await tx.ward.delete({
      where: {
          id,
          hospital_Id,
      },
    });
  });
}


  // Create Bed
  createBed(wardId: number, bedNo: number, hospital_Id: number) {
    return prisma.bed.create({
      data: {
        bedNo,
        wardId,
        
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
    where: { id },
    data,
  });
}


  // Delete Bed
  deleteBed(id: number, hospital_Id: number) {
    return prisma.bed.delete({
      where: { id },
    });
  }
}
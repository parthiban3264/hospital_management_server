import { Injectable ,NotFoundException } from '@nestjs/common';
import { PrismaClient} from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()

export class WardService {
  
async getWardsWithBeds(hospitalId: number) {
  const wards = await prisma.wards.findMany({
    where: { hospital_Id: hospitalId },
    include: {
      beds: {
        include: {
          admissions: {
            where: {
              status: {
                notIn: ['DISCHARGED', 'CANCELLED'], // show all except these
              },
            },
            include: {
              patient: true,
              charges: true,
            },
          },
        },
      },
    },
  });

  if (!wards.length) throw new NotFoundException('No wards found for this hospital');

  return wards;
}

  // Get single admission/patient details
async getAdmissionDetails(admissionId: number) {
  const admission = await prisma.admission.findUnique({
    where: { id: admissionId },
    include: {
      patient: true,
      bed: { include: { ward: true } },
      charges: true,
    },
  });

  if (!admission || ['DISCHARGED'].includes(admission.status)) {
    throw new NotFoundException('Admission not found or already discharged');
  }

  return admission;
}

// CREATE WARD
async createWard(
  data: { name: string; type: string; rent?: number; beds: any[] },
  hospital_Id: number,
) {
  return prisma.$transaction(async (tx) => {
    const ward = await tx.wards.create({
      data: {
        hospital_Id,
        name: data.name,
        type: data.type,
        rent: data.rent ?? 0, // use number directly
      },
    });

    if (data.beds?.length) {
      await tx.bed.createMany({
        data: data.beds.map((bed) => ({
          bedNo: bed.bedNo,
          wardId: ward.id,
          status: bed.status ?? "AVAILABLE",
        })),
      });
    }

    return ward;
  });
}

// UPDATE WARD (without beds)
updateWard(
  id: number,
  data: { name?: string; type?: string; rent?: number },
  hospital_Id: number,
) {
  return prisma.wards.update({
    where: { id, hospital_Id },
    data, // pass number directly, no conversion
  });
}

// UPDATE WARD WITH BEDS
async updateWardWithBeds(
  id: number,
  data: {
    name?: string;
    type?: string;
    rent?: number;
    beds?: { id: number; bedNo?: number; status?: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" }[];
  },
  hospital_Id: number,
) {
  return prisma.$transaction(async (tx) => {
    // update ward info
    await tx.wards.update({
      where: { id, hospital_Id },
      data: {
        name: data.name,
        type: data.type,
        rent: data.rent, // pass number directly
      },
    });

    // update beds
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

    return tx.wards.findUnique({
      where: { id },
      include: { beds: true },
    });
  });
}

  // Get All Wards
  getAllWards(hospital_Id: number) {
    return prisma.wards.findMany({
      where: { hospital_Id },
      include: { beds: true },
    });
  }

  // Get Ward by ID
  getWardById(id: number, hospital_Id: number) {
    return prisma.wards.findUnique({
      where: { id, hospital_Id },
      include: { beds: true },
    });
  }


//  async deleteWard(id: number, hospital_Id: number) {
//   return await prisma.$transaction(async (tx) => {
//     // 1. Delete all beds in the ward
//      tx.bed.deleteMany({
//       where: {
//         wardId: id,
//       },
//     });

//     // 2. Delete the ward
//     return await tx.ward.delete({
//       where: {
//           id,
//           hospital_Id,
//       },
//     });
//   });
// }


  // Create Bed
  createBed(wardId: number, bedNo: number, hospital_Id: number) {
    return prisma.bed.create({
      data: {
        bedNo,
        wardId,
        
      },
    });
  }

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

getAvailableBeds(hospital_Id: number) {
    return prisma.wards.findMany({
      where:{hospital_Id},
      include: {
        beds: {
          where: { status: 'AVAILABLE' },
        },
      },
    });
  }

  // Delete Bed
  deleteBed(id: number, hospital_Id: number) {
    return prisma.bed.delete({
      where: { id },
    });
  }
  async deleteWard(id: number,hospital_Id:number) {
  return prisma.$transaction(async (tx) => {
    await tx.bed.deleteMany({
      where: { wardId: id, },
    });
    return tx.wards.delete({
      where: { id,hospital_Id },
    });
  });
}
}
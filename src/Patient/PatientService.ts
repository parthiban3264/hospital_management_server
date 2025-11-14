// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class PatientService {
//   constructor(private prisma: PrismaService) {}

//   async create(data: any) {
//   const patient = await this.prisma.patient.create({
//     data: {
//       ...data,
//       hospital_Id: data.hospital_Id, // must exist
//       user_Id: data.user_Id,         // must exist
//     },
//   });

//   return {
//     status: 'success',
//     message: 'Patient created successfully',
//     data: patient,
//   };
// }


//   async findAll() {
//     const patients = await this.prisma.patient.findMany({
//       include: {
//         Hospital: true,
//         User: true,
//       },
//     });

//     return {
//       status: 'success',
//       message: 'Patients fetched successfully',
//       data: patients,
//     };
//   }

//   async findOne(id: number) {
//     const patient = await this.prisma.patient.findUnique({
//       where: { id },
//       include: {
//         Consultation: true,
//         Treatment: true,
//         Payments: true,
//       },
//     });

//     if (!patient) {
//       throw new NotFoundException(`Patient with ID ${id} not found`);
//     }

//     return {
//       status: 'success',
//       message: 'Patient fetched successfully',
//       data: patient,
//     };
//   }

//   async update(id: number, data: any) {
//     const patient = await this.prisma.patient.update({
//       where: { id },
//       data,
//     });

//     return {
//       status: 'success',
//       message: 'Patient updated successfully',
//       data: patient,
//     };
//   }

//   async delete(id: number) {
//     const patient = await this.prisma.patient.delete({
//       where: { id },
//     });

//     return {
//       status: 'success',
//       message: 'Patient deleted successfully',
//       data: patient,
//     };
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  // async create(data: any) {
  //   const patient = await this.prisma.patient.create({
  //     data: {
  //       ...data,
  //       hospital_Id: data.hospital_Id,
  //       user_Id: data.user_Id,
  //     },
  //   });

  //   return {
  //     status: 'success',
  //     message: 'Patient created successfully',
  //     data: patient,
  //   };
  // }

  async createPatientWithUser(data: any) {
  const defaultPassword = `abc123`;
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Normalize user ID (phone)
  const user_Id = data.phone.mobile.replace(/^(\+?91[\s-]*)?/, '').trim();

  // ✅ Use a callback transaction since we need sequential logic
  const result = await this.prisma.$transaction(async (tx) => {
    // 1️⃣ Create User
    const user = await tx.user.create({
      data: {
        hospital_Id: data.hospital_Id,
        user_Id: user_Id,
        password: hashedPassword,
        role: 'PATIENT',
      },
    });

    // 2️⃣ Create Patient
    const patient = await tx.patient.create({
      data: {
        ...data,
        phone: data.phone,
        hospital_Id: data.hospital_Id,
        createdAt: data.createdAt || new Date().toISOString(),
        user_Id: user_Id,
      },
    });
    // Return all created records
    return { user, patient, };
  });

  // Return result along with default password
  return { ...result, defaultPassword };
}


  async findAll() {
    const patients = await this.prisma.patient.findMany({
      include: {
        Hospital: true,
        User: true,
      },
    });

    return {
      status: 'success',
      message: 'Patients fetched successfully',
      data: patients,
    };
  }

  async findOneByUserId(hospital_Id: number, user_Id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        hospital_Id_user_Id: {
          hospital_Id,
          user_Id,
        },
      },
      include: {
        Consultation: {select: {id: true, patient_Id: true, status:true },},
        // Payments: true,
        Hospital: {select: {id:true ,name: true,}},
        User: {select: {id:true, user_Id: true, role: true,},} 
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with user_Id ${user_Id} in hospital ${hospital_Id} not found`,
      );
    }

    return {
      status: 'success',
      message: 'Patient fetched successfully',
      data: patient,
    };
  }

    async findCheckUserId(hospital_Id: number, user_Id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        hospital_Id_user_Id: {
          hospital_Id,
          user_Id,
        },
      },
      include: {
        Consultation: {select: {id: true, patient_Id: true, status:true },},
        Hospital: true,
        User: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(
        `Patient with user_Id ${user_Id} in hospital ${hospital_Id} not found`,
      );
    }

    return {
      status: 'success',
      message: 'Patient fetched successfully',
      data: patient,
    };
  }

  async updateByUserId(hospital_Id: number, user_Id: string, data: any) {
    const patient = await this.prisma.patient.update({
      where: {
        hospital_Id_user_Id: {
          hospital_Id,
          user_Id,
        },
      },
      data,
    });

    return {
      status: 'success',
      message: 'Patient updated successfully',
      data: patient,
    };
  }

  async deleteByUserId(hospital_Id: number, user_Id: string) {
    const patient = await this.prisma.patient.delete({
      where: {
        hospital_Id_user_Id: {
          hospital_Id,
          user_Id,
        },
      },
    });

    return {
      status: 'success',
      message: 'Patient deleted successfully',
      data: patient,
    };
  }
}



import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { log } from 'console';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async createPatientWithUser(data: any) {
    const defaultPassword = `abc123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // ---- Fetch Fees ----
    const registrationFee = await this.prisma.fees.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        type: 'REGISTRATION FEE',
      },
    });

    const appointmentFee = await this.prisma.fees.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        type: 'APPOINTMENT FEE',
      },
    });

    // ---- Fetch Doctor Amount ----
    const doctorData = await this.prisma.admin.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        user_Id: data.doctor_Id,
      },
    });

    const doctorAmount = doctorData?.doctorAmount ?? 0;

    // ---- Extract Fee Amounts ----
    const regAmount = registrationFee?.amount ?? 0;
    const appointAmount = appointmentFee?.amount ?? 0;

    // ---- If both fees missing, show message ----
    if (
      (!regAmount && !doctorAmount) ||
      (regAmount == 0 && doctorAmount == 0)
    ) {
      return {
        status: 'failed',
        message:
          '⚠️ Registration Fee or Appointment Fee is not set! Please assign Registration Fees after register.',
      };
    }
    console.log('user Data', data);

    // Normalize user ID (phone)
    const user_Id = data.phone.mobile.replace(/^(\+?91[\s-]*)?/, '').trim();

    // ✅ Use a callback transaction since we need sequential logic
    // const result = await this.prisma.$transaction(async (tx) => {

    //   // 2️⃣ Create Patient
    //   const patient = await tx.patient.create({
    //     data: {
    //       ...data,
    //       hospital_Id: data.hospital_Id,
    //       phone: data.phone,
    //       createdAt: data.createdAt || new Date().toISOString(),
    //       user_Id: user_Id,
    //     },
    //   });
    //   const user = await tx.user.create({
    //   data: {
    //     hospital_Id: data.hospital_Id,
    //     user_Id: patient.id.toString(), // ✅ LOGIN ID
    //     password: hashedPassword,
    //     role: 'PATIENT',
    //   },
    // });
    //   // Return all created records
    //   return { user, patient };
    // });

    const result = await this.prisma.$transaction(async (tx) => {
      // 🔑 NEW: get next patient id per hospital
      const lastPatient = await tx.patient.findFirst({
        where: { hospital_Id: Number(data.hospital_Id) },
        orderBy: { id: 'desc' },
        select: { id: true },
      });

      const nextPatientId = (lastPatient?.id ?? 0) + 1;
      log('nextPatientId', nextPatientId);

      // 2️⃣ Create Patient (SMALL ADDITION ONLY)
      const patient = await tx.patient.create({
        data: {
          ...data,
          id: nextPatientId, // ✅ REQUIRED
          hospital_Id: Number(data.hospital_Id),
          phone: data.phone,
          createdAt: data.createdAt || new Date().toISOString(),
          user_Id: user_Id,
        },
      });

      // 3️⃣ Create User (NO CHANGE)
      // const user = await tx.user.create({
      //   data: {
      //     hospital_Id: data.hospital_Id,
      //     user_Id: patient.id.toString(), // still works
      //     password: hashedPassword,
      //     role: 'PATIENT',
      //   },
      // });

      let user;
      let userIdNumber = patient.id;

      while (true) {
        try {
          user = await tx.user.create({
            data: {
              hospital_Id: data.hospital_Id,
              user_Id: userIdNumber.toString(),
              password: hashedPassword,
              role: 'PATIENT',
            },
          });

          break; // ✅ success
        } catch (error) {
          if (error.code === 'P2002') {
            // 🔁 If duplicate, increment ID
            userIdNumber++;
          } else {
            throw error; // other errors
          }
        }
      }

      return { user, patient };
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
        id_hospital_Id: {
          hospital_Id: hospital_Id,
          id: Number(user_Id),
        },
      },
      include: {
        Consultation: { select: { id: true, patient_Id: true, status: true } },
        Payments: true,
        Hospital: { select: { id: true, name: true } },
        User: { select: { id: true, user_Id: true, role: true } },
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
    const patients = await this.prisma.patient.findMany({
      where: {
        hospital_Id,
        user_Id,
      },
      include: {
        Consultation: { select: { id: true, patient_Id: true, status: true } },
        Hospital: true,
        User: true,
      },
    });

    if (patients.length === 0) {
      throw new NotFoundException(
        `Patient with user_Id ${user_Id} in hospital ${hospital_Id} not found`,
      );
    }
    log('Patients found: %o', patients);
    return {
      status: 'success',
      message: 'Patients fetched successfully',
      data: patients, // return all matching patients
    };
  }

  async updateByUserId(hospital_Id: number, user_Id: string, data: any) {
    const patient = await this.prisma.patient.update({
      where: {
        id_hospital_Id: {
          hospital_Id: hospital_Id,
          id: Number(user_Id),
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

  // async deleteByUserId(hospital_Id: number, user_Id: string) {
  //   const patient = await this.prisma.patient.delete({
  //     where: {
  //       hospital_Id,
  //       id: Number(user_Id),
  //     },
  //   });

  //   return {
  //     status: 'success',
  //     message: 'Patient deleted successfully',
  //     data: patient,
  //   };
  // }
  async deleteByUserId(hospital_Id: number, user_Id: string) {
    const patient = await this.prisma.patient.delete({
      where: {
        id_hospital_Id: {
          hospital_Id: hospital_Id,
          id: Number(user_Id),
        },
      },
    });

    return {
      status: 'success',
      message: 'Patient deleted successfully',
      data: patient,
    };
  }

async takePatientBloodGrp(hospitalId: number) {
  const today = new Date();
  const cutoffDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  );

  const patients = await this.prisma.patient.findMany({
    where: {
      hospital_Id: hospitalId,
      dob: {
        lte: cutoffDate, // 18+
      },
    },
    select: {
      id: true,
      user_Id: true,
      name: true,
      gender: true,
      phone: true,
      bldGrp: true,
      address:true,
      dob: true,
      bld_donate_date: true,
    },
  });

  /// ✅ Blood group count (skip unknown/null)
  const bloodGroupCount = patients.reduce((acc, p) => {
    const group = p.bldGrp;

    // ❌ skip null / undefined / empty / UNKNOWN
    if (!group || group === "UNKNOWN") {
      return acc;
    }

    if (!acc[group]) {
      acc[group] = 0;
    }

    acc[group]++;

    return acc;
  }, {} as Record<string, number>);

  const patientData = {
    bloodGroupCount,
    patients,
  };

  return patientData;
}
}

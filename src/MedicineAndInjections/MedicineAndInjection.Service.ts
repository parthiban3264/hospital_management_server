// import { Injectable, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "src/prisma/prisma.service";

// @Injectable()
// export class MedicineAndInjectionService {
//   constructor(private prisma: PrismaService) {}

//   async create(data: any) {
//     try {
//       const record = await this.prisma.medicineAndInjection.create({
//         data: {
//           hospital_Id: data.hospital_Id,
//           patient_Id: data.patient_Id,
//           doctor_Id: data.doctor_Id,
//           staff_Id: data.staff_Id,
//           medicine_Id: data.medicine_Id,
//           DosageMedicine: data.DosageMedicine,
//           injection_Id: data.injection_Id,
//           DosageInjection: data.DosageMedicine,
//           status: data.status,
//           MedicineAndInjectionnotes : data.notes,
//           paymentStatus: data.paymentStatus,
//         },
//       });
//       return { status: "success", message: "Record created", data: record };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async findAll() {
//     const records = await this.prisma.medicineAndInjection.findMany({
//       include: { Hospital: true, Patient: true, Medician: true, Injection: true },
//     });
//     return { status: "success", message: "Records fetched", data: records };
//   }

//   async findOne(id: number) {
//     const record = await this.prisma.medicineAndInjection.findUnique({
//       where: { id },
//       include: { Hospital: true, Patient: true, Medician: true, Injection: true },
//     });
//     if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
//     return { status: "success", message: "Record fetched", data: record };
//   }

//   async update(id: number, data: any) {
//     try {
//       const record = await this.prisma.medicineAndInjection.update({
//         where: { id },
//         data,
//       });
//       return { status: "success", message: "Record updated", data: record };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async remove(id: number) {
//     try {
//       const record = await this.prisma.medicineAndInjection.delete({ where: { id } });
//       return { status: "success", message: "Record deleted", data: record };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }
// }

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MedicineAndInjectionService {
  constructor(private prisma: PrismaService) {}

  /** ✅ Create a new Medicine & Injection record */
  async create(data: any) {
    try {
      console.log(data.medicine_Id,'---medicine ids---');
      
      const record = await this.prisma.medicineAndInjection.create({
        data: {
          hospital_Id: Number(data.hospital_Id),
          patient_Id: Number(data.patient_Id),
          doctor_Id: data.doctor_Id ?? [],
          staff_Id: data.staff_Id ?? [],

          medicine_Id: data.medicine_Id ?? [],
          dosageMedicine: data.dosageMedicine ?? {},
          medicineNotes: data.medicineNotes ?? {},
          frequencyMedicine: data.frequencyMedicine ?? {},
          durationMedicine: data.durationMedicine ?? null,
          medicineStatus: Boolean(data.medicineStatus ?? false),

          injection_Id: data.injection_Id ?? [],
          dosageInjection: data.dosageInjection ?? {},
          InjectionNotes: data.InjectionNotes ?? {},
          frequencyInjection: data.frequencyInjection ?? {},
          durationInjection: data.durationInjection ?? null,
          injectionStatus: Boolean(data.injectionStatus ?? false),

          paymentStatus: Boolean(data.paymentStatus ?? false),
        },
      });
      

      return { status: "success", message: "Record created successfully", data: record };
    } catch (error) {
      console.error("❌ Create Error:", error);
      return { status: "failed", message: "Error creating record", error: error.message };
    }
  }

  /** ✅ Get all records */
  async findAll() {
    const records = await this.prisma.medicineAndInjection.findMany({
      include: { Hospital: true, Patient: true, Medician: true, Injection: true },
      orderBy: { createdAt: "desc" },
    });
    return { status: "success", data: records };
  }

  /** ✅ Get all by Hospital ID */
  async findAllByHospital(hospital_Id: number) {
    const records = await this.prisma.medicineAndInjection.findMany({
      where: { hospital_Id },
      include: { Hospital: true, Patient: true, Medician: true, Injection: true },
      orderBy: { createdAt: "desc" },
    });
    return { status: "success", data: records };
  }

  /** ✅ Get one record by ID */
  async findOne(id: number) {
    const record = await this.prisma.medicineAndInjection.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Medician: true, Injection: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: "success", data: record };
  }

  /** ✅ Update existing record */
  async update(id: number, data: any) {
    try {
      const record = await this.prisma.medicineAndInjection.update({
        where: { id },
        data: {
          doctor_Id: data.doctor_Id,
          staff_Id: data.staff_Id,
          medicine_Id: data.medicine_Id,
          dosageMedicine: data.dosageMedicine,
          medicineNotes: data.medicineNotes,
          frequencyMedicine: data.frequencyMedicine,
          durationMedicine: data.durationMedicine,
          medicineStatus: data.medicineStatus,
          injection_Id: data.injection_Id,
          dosageInjection: data.dosageInjection,
          InjectionNotes: data.InjectionNotes,
          frequencyInjection: data.frequencyInjection,
          durationInjection: data.durationInjection,
          injectionStatus: data.injectionStatus,
          paymentStatus: data.paymentStatus,
          status: data.status,
        },
      });
      return { status: "success", message: "Record updated", data: record };
    } catch (error) {
      console.error("❌ Update Error:", error);
      return { status: "failed", message: "Error updating record", error: error.message };
    }
  }

  /** ✅ Delete a record */
  async remove(id: number) {
    try {
      const record = await this.prisma.medicineAndInjection.delete({ where: { id } });
      return { status: "success", message: "Record deleted", data: record };
    } catch (error) {
      console.error("❌ Delete Error:", error);
      return { status: "failed", message: "Error deleting record", error: error.message };
    }
  }
}

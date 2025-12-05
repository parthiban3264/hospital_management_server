import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentStatus, Type } from '@prisma/client';

@Injectable()
export class MedicineTonicInjectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.$transaction(async (tx) => {
      const { hospital_Id, patient_Id, doctor_Id, createdAt } = data;

      // ✅ 1️⃣ Calculate total from all three types
      let totalAmount = 0;
      if (data.medicines?.length) {
        totalAmount += data.medicines.reduce(
          (sum, m) => sum + (Number(m.total) || 0),
          0,
        );
      }
      if (data.injections?.length) {
        totalAmount += data.injections.reduce(
          (sum, i) => sum + (Number(i.total) || 0),
          0,
        );
      }
      if (data.tonics?.length) {
        totalAmount += data.tonics.reduce(
          (sum, t) => sum + (Number(t.total) || 0),
          0,
        );
      }

      // ✅ 2️⃣ Find or create pending payment entry
      let payment = await tx.payment.findFirst({
        where: {
          hospital_Id,
          patient_Id,
          type: Type.MEDICINETONICINJECTIONFEES,
          status: PaymentStatus.PENDING,
        },
      });

      if (payment) {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            amount: (Number(payment.amount) || 0) + totalAmount,
            updatedAt: createdAt ?? new Date().toISOString(),
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            hospital_Id,
            patient_Id,
            reason: 'Prescription Fees',
            consultation_Id: data.consultation_Id,
            type: Type.MEDICINETONICINJECTIONFEES,
            status: PaymentStatus.PENDING,
            amount: totalAmount, // ✅ number, not string
            createdAt: createdAt ?? new Date().toISOString(),
          },
        });
      }

      const createdAtValue = createdAt ?? new Date().toISOString();
      const results: any = { payment };
    

      // ✅ 3️⃣ Medicines
      if (data.medicines?.length) {
        console.log('tonics data',data.medicines);
        const medData = data.medicines.map((m) => ({
          ...m,
          hospital_Id,
          patient_Id,
          doctor_Id,
          payment_Id: payment.id,
          createdAt: createdAtValue,
        }));

        await tx.medicinePatient.createMany({ data: medData });
        results.medicines = medData;
      }

      // ✅ 4️⃣ Tonics
      if (data.tonics?.length) {
        console.log('tonics data',data.tonics);
        
        const tonicData = data.tonics.map((t) => ({
          ...t,
          hospital_Id,
          patient_Id,
          doctor_Id,
          payment_Id: payment.id,
          createdAt: createdAtValue,
        }));

        await tx.tonicPatient.createMany({ data: tonicData });
        results.tonics = tonicData;
      }

      // ✅ 5️⃣ Injections
      if (data.injections?.length) {
        const injData = data.injections.map((i) => ({
          ...i,
          hospital_Id,
          patient_Id,
          doctor_Id,
          payment_Id: payment.id,
          createdAt: createdAtValue,
        }));

        await tx.injectionPatient.createMany({ data: injData });
        results.injections = injData;
      }

      // ✅ 6️⃣ Return summary
      return results;
    });
  }

   // ✅ GET grouped by hospital
  async getAllByHospital(hospital_Id: number) {
    const [medicines, tonics, injections] = await Promise.all([
      this.prisma.medicinePatient.findMany({ where: { hospital_Id } }),
      this.prisma.tonicPatient.findMany({ where: { hospital_Id } }),
      this.prisma.injectionPatient.findMany({ where: { hospital_Id } }),
    ]);
    return { medicines, tonics, injections };
  }

  // ✅ UPDATE by type and id
  async updateRecord(type: "medicine" | "tonic" | "injection", id: number, data: any) {
    console.log('data',data,id,type);
    
    const updatedData = {
      ...data,
      // updatedAt: new Date().toISOString(),
    };

    if (type === "medicine") {
      const existing = await this.prisma.medicinePatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      return this.prisma.medicinePatient.update({
        where: { id },
        data: updatedData,
      });
    }

    if (type === "tonic") {
      const existing = await this.prisma.tonicPatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      return this.prisma.tonicPatient.update({
        where: { id },
        data: updatedData,
      });
    }

    if (type === "injection") {
      const existing = await this.prisma.injectionPatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      return this.prisma.injectionPatient.update({
        where: { id },
        data: updatedData,
      });
    }

    throw new HttpException("Invalid type provided", HttpStatus.BAD_REQUEST);
  }

  // ✅ DELETE by type and id
  async deleteRecord(type: "medicine" | "tonic" | "injection", id: number) {
    if (type === "medicine") {
      const existing = await this.prisma.medicinePatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      await this.prisma.medicinePatient.delete({ where: { id } });
      return { message: `${type} record deleted successfully`, id };
    }

    if (type === "tonic") {
      const existing = await this.prisma.tonicPatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      await this.prisma.tonicPatient.delete({ where: { id } });
      return { message: `${type} record deleted successfully`, id };
    }

    if (type === "injection") {
      const existing = await this.prisma.injectionPatient.findUnique({ where: { id } });
      if (!existing) throw new HttpException("Record not found", HttpStatus.NOT_FOUND);
      await this.prisma.injectionPatient.delete({ where: { id } });
      return { message: `${type} record deleted successfully`, id };
    }

    throw new HttpException("Invalid type provided", HttpStatus.BAD_REQUEST);
  }
}


import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';
import { log } from 'console';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}

  // 🧑‍⚕️ CREATE PRESCRIPTION
  async createPrescription(dto: CreatePrescriptionDto) {
    log('prescription', dto);
    return this.prisma.prescription.create({
      data: {
        hospital_Id: Number(dto.hospital_Id),
        prescription_no: `RX-${Date.now()}`,
        patient_Id: Number(dto.patient_Id),
        doctor_Id: dto.doctor_Id.toString(),
        consultation_Id: dto.consultation_Id,
        notes: dto.notes,
        follow_up_date: dto.follow_up_date,
        valid_till: dto.valid_till,
        medicines: {
          create: dto.medicines.map((med) => ({
            medicine: {
              connect: { id: med.medicine_Id },
            },
            dosage: med.dosage,
            route: med.route as any, // enum cast
            frequency: med.frequency,
            days: med.days,
            total_quantity: med.total_quantity,
            after_food: med.after_food ?? false,
            morning: med.morning ?? false,
            afternoon: med.afternoon ?? false,
            night: med.night ?? false,
            instructions: med.instructions,
          })),
        },
      },
      include: {
        medicines: true,
      },
    });
  }

  // 🏥 DISPENSE MEDICINE (PHARMACY)
 async dispenseMedicine(

  dto: DispenseMedicineDto,
) {
    log('despense',dto);
  return this.prisma.$transaction(async (tx) => {
    // 1. prescription medicine
    const prescriptionMedicine =
      await tx.prescriptionMedicine.findUnique({
        where: { id: dto.prescription_medicine_Id },
        include: { prescription: true },
      });

    if (!prescriptionMedicine) {
      throw new BadRequestException('Prescription medicine not found');
    }

    // 2. quantity check
    const remaining =
      prescriptionMedicine.total_quantity -
      prescriptionMedicine.dispensed_quantity;

    if (dto.dispensed_quantity > remaining) {
      throw new BadRequestException('Quantity exceeded');
    }

    // 3. batch check
    const batch = await tx.medicineBatch.findUnique({
  where: {
    hospital_Id_medicine_id_batch_no: {
      hospital_Id: dto.hospital_Id,
      medicine_id: prescriptionMedicine.medicine_Id,
      batch_no: dto.batch_Id.toString(), // STRING
    },
  },
});

log('batch',batch);
    if (!batch || batch.quantity < dto.dispensed_quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // 4. amount
    const amount =
      dto.dispensed_quantity * batch.selling_price_unit;

    // 5. create dispense
    const dispense = await tx.prescriptionDispense.create({
      data: {
        hospital_Id: dto.hospital_Id,
        prescription_medicine_Id: dto.prescription_medicine_Id,
        medicine_Id: prescriptionMedicine.medicine_Id,
        batch_Id: Number(dto.batch_Id),
        dispensed_quantity: dto.dispensed_quantity,
        dispensed_by: Number(dto.pharmacist_Id),
      },
    });

    // 6. reduce batch stock
    // await tx.medicineBatch.update({
    //   where: { id: Number(dto.batch_Id) },
    //   data: {
    //     quantity: { decrement: dto.dispensed_quantity },
    //   },
    // });

    await tx.medicineBatch.update({
  where: {
    hospital_Id_medicine_id_batch_no: {
      hospital_Id: dto.hospital_Id,
      medicine_id: prescriptionMedicine.medicine_Id,
      batch_no: dto.batch_Id.toString(), // STRING
    },
  },
  data: {
    quantity: { decrement: dto.dispensed_quantity },
  },
});

    // 7. update prescription medicine
    const newQty =
      prescriptionMedicine.dispensed_quantity +
      dto.dispensed_quantity;

    await tx.prescriptionMedicine.update({
      where: { id: dto.prescription_medicine_Id },
      data: {
        dispensed_quantity: newQty,
        status:
          newQty === prescriptionMedicine.total_quantity
            ? 'COMPLETED'
            : 'ONGOING',
      },
    });

    // 8. payment
    await tx.payment.create({
      data: {
        hospital_Id: dto.hospital_Id,
        patient_Id: prescriptionMedicine.prescription.patient_Id,
        consultation_Id:
          prescriptionMedicine.prescription.consultation_Id,
        prescription_Id:
          prescriptionMedicine.prescription_Id,
        reason: 'Prescription Fee',
        amount :amount,
        createdBy: dto.pharmacist_Id.toString(),
        createdAt: new Date().toDateString(), // ✅ IMPORTANT
      },
    });

    return {
      dispense,
      amount,
    };
  });
}


  // 📄 GET PRESCRIPTION (Doctor / Pharmacy)
  async getPrescription(id: number) {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        medicines: {
          include: {
            medicine: true,
            dispenses: {
              include: { batch: true },
            },
          },
        },
      },
    });
  }
}

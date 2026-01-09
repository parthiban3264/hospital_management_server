import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}

  // 🧑‍⚕️ CREATE PRESCRIPTION
  async createPrescription(hospital_Id: number, dto: CreatePrescriptionDto) {
    return this.prisma.prescription.create({
  data: {
    hospital_Id,
    prescription_no: `RX-${Date.now()}`,
    patient_Id: dto.patient_Id,
    doctor_Id: dto.doctor_Id,
    consultation_Id: dto.consultation_Id,
    notes: dto.notes,
    follow_up_date: dto.follow_up_date,
    valid_till: dto.valid_till,
    medicines: {
      create: dto.medicines.map(med => ({
        medicine: {
          connect: { id: med.medicine_Id }
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
        instructions: med.instructions
      }))
    }
  },
  include: {
    medicines: true
  }
});


  }

  // 🏥 DISPENSE MEDICINE (PHARMACY)
  async dispenseMedicine(
    hospital_Id: number,
    pharmacist_Id: number,
    dto: DispenseMedicineDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Get prescription medicine
      const prescriptionMedicine = await tx.prescriptionMedicine.findUnique({
        where: { id: dto.prescription_medicine_Id },
        include: {
          prescription: true,
        },
      });

      if (!prescriptionMedicine) {
        throw new BadRequestException('Prescription medicine not found');
      }

      // 2️⃣ Quantity validation
      const remainingQty =
        prescriptionMedicine.total_quantity -
        prescriptionMedicine.dispensed_quantity;

      if (dto.dispensed_quantity > remainingQty) {
        throw new BadRequestException(
          'Dispensed quantity exceeds pending quantity',
        );
      }

      // 3️⃣ Get batch
      const batch = await tx.medicineBatch.findUnique({
        where: { id: dto.batch_Id },
      });

      if (!batch || batch.quantity < dto.dispensed_quantity) {
        throw new BadRequestException('Insufficient batch stock');
      }

      // 4️⃣ Calculate amount
      const amount = dto.dispensed_quantity * batch.selling_price_unit;

      // 5️⃣ Create dispense
      const dispense = await tx.prescriptionDispense.create({
        data: {
          hospital_Id,
          prescription_medicine_Id: dto.prescription_medicine_Id,
          medicine_Id: prescriptionMedicine.medicine_Id,
          batch_Id: dto.batch_Id,
          dispensed_quantity: dto.dispensed_quantity,
          dispensed_by: pharmacist_Id,
        },
      });

      // 6️⃣ Reduce batch stock
      await tx.medicineBatch.update({
        where: { id: dto.batch_Id },
        data: {
          quantity: { decrement: dto.dispensed_quantity },
        },
      });

      // 7️⃣ Update prescription medicine status
      const newDispensedQty =
        prescriptionMedicine.dispensed_quantity + dto.dispensed_quantity;

      await tx.prescriptionMedicine.update({
        where: { id: dto.prescription_medicine_Id },
        data: {
          dispensed_quantity: newDispensedQty,
          status:
            newDispensedQty === prescriptionMedicine.total_quantity
              ? 'COMPLETED'
              : 'ONGOING',
        },
      });

      // 8️⃣ Stock movement
      await tx.stockMovement.create({
        data: {
          hospital_Id,
          batch_id: dto.batch_Id,
          movement_type: 'OUT',
          quantity: dto.dispensed_quantity,
          reason: 'PRESCRIPTION DISPENSE',
        },
      });

      // 9️⃣ CREATE PAYMENT (SAME PATIENT)
      await tx.payment.create({
        data: {
          hospital_Id,
          patient_Id: prescriptionMedicine.prescription.patient_Id,
          consultation_Id: prescriptionMedicine.prescription.consultation_Id,
          prescription_Id: prescriptionMedicine.prescription_Id,
          reason: 'MEDICINE DISPENSE',
          amount: amount,
          createdBy: pharmacist_Id.toString(),
          createdAt: new Date().toISOString(),
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

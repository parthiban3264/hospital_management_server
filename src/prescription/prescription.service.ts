import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';
import { log } from 'console';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}

//   // 🧑‍⚕️ CREATE PRESCRIPTION
//   async createPrescription(dto: CreatePrescriptionDto) {
//     log('prescription', dto);
//     let payment = await tx.payment.findFirst({
//   where: {
//     hospital_Id: data.hospital_Id,
//     patient_Id: data.patient_Id,
//     consultation_Id: data.consultation_Id, // ✅ IMPORTANT
//     type: 'MEDICINETONICINJECTIONFEES',
//     status: 'PENDING',
//   },
// });

//     return this.prisma.prescription.create({
//       data: {
//         hospital_Id: Number(dto.hospital_Id),
//         prescription_no: `RX-${Date.now()}`,
//         patient_Id: Number(dto.patient_Id),
//         doctor_Id: dto.doctor_Id.toString(),
//         consultation_Id: dto.consultation_Id,
//         payment_Id: paymentId,
//         notes: dto.notes,
//         follow_up_date: dto.follow_up_date,
//         valid_till: dto.valid_till,
//         medicines: {
//           create: dto.medicines.map((med) => ({
//             medicine: {
//               connect: { id: med.medicine_Id },
//             },
//             dosage: med.dosage,
//             route: med.route as any, // enum cast
//             frequency: med.frequency,
//             days: med.days,
//             total_quantity: med.total_quantity,
//             after_food: med.after_food ?? false,
//             morning: med.morning ?? false,
//             afternoon: med.afternoon ?? false,
//             night: med.night ?? false,
//             instructions: med.instructions,
//           })),
//         },
//       },
//       include: {
//         medicines: true,
//       },
//     });
//   }

// export class PrescriptionService {
//   constructor(private readonly prisma: PrismaService) {}

//   async createPrescription(dto: CreatePrescriptionDto) {
//     return this.prisma.$transaction(async (tx) => {
//       // 1️⃣ Find existing pending payment
//       let payment = await tx.payment.findFirst({
//         where: {
//           hospital_Id: Number(dto.hospital_Id),
//           patient_Id: Number(dto.patient_Id),
//           consultation_Id: dto.consultation_Id,
//           type: 'MEDICINETONICINJECTIONFEES',
//           status: 'PENDING',
//         },
//       });

//       // 2️⃣ If not exists → create payment
//       if (!payment) {
//         payment = await tx.payment.create({
//           data: {
//             hospital_Id: Number(dto.hospital_Id),
//             patient_Id: Number(dto.patient_Id),
//             consultation_Id: Number(dto.consultation_Id),
//             type: 'MEDICINETONICINJECTIONFEES',
//             reason: 'Prescription Fee',
//             amount: , // update later when dispensing
//             status: 'PENDING',
//             createdBy: dto.doctor_Id.toString(),
//           },
//         });
//       }

//       // 3️⃣ Create prescription with payment_Id
//       const prescription = await tx.prescription.create({
//         data: {
//           hospital_Id: Number(dto.hospital_Id),
//           prescription_no: `RX-${Date.now()}`,
//           patient_Id: Number(dto.patient_Id),
//           doctor_Id: dto.doctor_Id.toString(),
//           consultation_Id: dto.consultation_Id,
//           payment_Id: payment.id, // ✅ correct
//           notes: dto.notes,
//           follow_up_date: dto.follow_up_date,
//           valid_till: dto.valid_till,

//           medicines: {
//             create: dto.medicines.map((med) => ({
//               medicine: {
//                 connect: { id: med.medicine_Id },
//               },
//               dosage: med.dosage,
//               route: med.route as any,
//               frequency: med.frequency,
//               days: med.days,
//               total_quantity: med.total_quantity,
//               after_food: med.after_food ?? false,
//               morning: med.morning ?? false,
//               afternoon: med.afternoon ?? false,
//               night: med.night ?? false,
//               instructions: med.instructions,
//             })),
//           },
//         },
//         include: {
//           medicines: true,
//         },
//       });

//       return prescription;
//     });
//   }


//   // 🏥 DISPENSE MEDICINE (PHARMACY)
//  async dispenseMedicine(

//   dto: DispenseMedicineDto,
// ) {
//     log('despense',dto);
//   return this.prisma.$transaction(async (tx) => {
//     // 1. prescription medicine
//     const prescriptionMedicine =
//       await tx.prescriptionMedicine.findUnique({
//         where: { id: dto.prescription_medicine_Id },
//         include: { prescription: true },
//       });

//     if (!prescriptionMedicine) {
//       throw new BadRequestException('Prescription medicine not found');
//     }

//     // 2. quantity check
//     const remaining =
//       prescriptionMedicine.total_quantity -
//       prescriptionMedicine.dispensed_quantity;

//     if (dto.dispensed_quantity > remaining) {
//       throw new BadRequestException('Quantity exceeded');
//     }

//     // 3. batch check
//     const batch = await tx.medicineBatch.findUnique({
//   where: {
//     hospital_Id_medicine_id_batch_no: {
//       hospital_Id: dto.hospital_Id,
//       medicine_id: prescriptionMedicine.medicine_Id,
//       batch_no: dto.batch_Id.toString(), // STRING
//     },
//   },
// });

// log('batch',batch);
//     if (!batch || batch.quantity < dto.dispensed_quantity) {
//       throw new BadRequestException('Insufficient stock');
//     }

//     // 4. amount
//     // const amount =
//     //   dto.dispensed_quantity * batch.selling_price_unit;

//     // 5. create dispense
//     const dispense = await tx.prescriptionDispense.create({
//       data: {
//         hospital_Id: dto.hospital_Id,
//         prescription_medicine_Id: dto.prescription_medicine_Id,
//         medicine_Id: prescriptionMedicine.medicine_Id,
//         batch_Id: Number(dto.batch_Id),
//         dispensed_quantity: dto.dispensed_quantity,
//         dispensed_by: Number(dto.pharmacist_Id),
//       },
//     });

//     // 6. reduce batch stock
//     // await tx.medicineBatch.update({
//     //   where: { id: Number(dto.batch_Id) },
//     //   data: {
//     //     quantity: { decrement: dto.dispensed_quantity },
//     //   },
//     // });

//     await tx.medicineBatch.update({
//   where: {
//     hospital_Id_medicine_id_batch_no: {
//       hospital_Id: dto.hospital_Id,
//       medicine_id: prescriptionMedicine.medicine_Id,
//       batch_no: dto.batch_Id.toString(), // STRING
//     },
//   },
//   data: {
//     quantity: { decrement: dto.dispensed_quantity },
//   },
// });

//     // 7. update prescription medicine
//     const newQty =
//       prescriptionMedicine.dispensed_quantity +
//       dto.dispensed_quantity;

//     await tx.prescriptionMedicine.update({
//       where: { id: dto.prescription_medicine_Id },
//       data: {
//         dispensed_quantity: newQty,
//         status:
//           newQty === prescriptionMedicine.total_quantity
//             ? 'COMPLETED'
//             : 'ONGOING',
//       },
//     });



//     return {
//       dispense,
//     };
//   });
// }
  async createPrescription(dto: CreatePrescriptionDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Find existing pending payment for same consultation
      let payment = await tx.payment.findFirst({
        where: {
          hospital_Id: Number(dto.hospital_Id),
          patient_Id: Number(dto.patient_Id),
          consultation_Id: Number(dto.consultation_Id),
          type: 'MEDICINETONICINJECTIONFEES',
          status: 'PENDING',
        },
      });

      // 2️⃣ Create payment if not exists
      if (!payment) {
        payment = await tx.payment.create({
          data: {
            hospital_Id: Number(dto.hospital_Id),
            patient_Id: Number(dto.patient_Id),
            consultation_Id: Number(dto.consultation_Id),
            type: 'MEDICINETONICINJECTIONFEES',
            reason: 'Prescription Fee',
            amount: 0, // ✅ will be incremented during dispense
            status: 'PENDING',
            createdAt: dto.createdAt || new Date(),
            // createdBy: dto.doctor_Id.toString(),
          },
        });
      }

      // 3️⃣ Create prescription
      const prescription = await tx.prescription.create({
        data: {
          hospital_Id: Number(dto.hospital_Id),
          prescription_no: `RX-${Date.now()}`,
          patient_Id: Number(dto.patient_Id),
          doctor_Id: dto.doctor_Id.toString(),
          consultation_Id: Number(dto.consultation_Id),
          payment_Id: payment.id, // ✅ linked payment
          notes: dto.notes,
          follow_up_date: dto.follow_up_date,
          valid_till: dto.valid_till,

          medicines: {
            create: dto.medicines.map((med) => ({
              medicine: {
                connect: { id: med.medicine_Id },
              },
              dosage: med.dosage,
              route: med.route as any,
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

      return prescription;
    });
}

  // 🏥 DISPENSE MEDICINE
  async dispenseMedicine(dto: DispenseMedicineDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Prescription medicine
      const prescriptionMedicine =
        await tx.prescriptionMedicine.findUnique({
          where: { id: dto.prescription_medicine_Id },
          include: { prescription: true },
        });

      if (!prescriptionMedicine) {
        throw new BadRequestException('Prescription medicine not found');
      }

      // 2️⃣ Quantity check
      const remaining =
        prescriptionMedicine.total_quantity -
        prescriptionMedicine.dispensed_quantity;

      if (dto.dispensed_quantity > remaining) {
        throw new BadRequestException('Quantity exceeded');
      }

      // 3️⃣ Batch check (by batch_no)
      const batch = await tx.medicineBatch.findUnique({
        where: {
          hospital_Id_medicine_id_batch_no: {
            hospital_Id: dto.hospital_Id,
            medicine_id: prescriptionMedicine.medicine_Id,
            batch_no: dto.batch_Id.toString(), // STRING batch_no
          },
        },
      });

      if (!batch || batch.quantity < dto.dispensed_quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      // 4️⃣ Calculate amount
      const amount =
        dto.dispensed_quantity * batch.selling_price_unit;

      // 5️⃣ Create dispense record
      const dispense = await tx.prescriptionDispense.create({
        data: {
          hospital_Id: dto.hospital_Id,
          prescription_medicine_Id: dto.prescription_medicine_Id,
          medicine_Id: prescriptionMedicine.medicine_Id,
          batch_Id: batch.id,
          dispensed_quantity: dto.dispensed_quantity,
          dispensed_by: Number(dto.pharmacist_Id),
          amount, // ✅ store line amount
        },
      });

      // 6️⃣ Reduce batch stock
      await tx.medicineBatch.update({
        where: {
          hospital_Id_medicine_id_batch_no: {
            hospital_Id: dto.hospital_Id,
            medicine_id: prescriptionMedicine.medicine_Id,
            batch_no: dto.batch_Id.toString(),
          },
        },
        data: {
          quantity: { decrement: dto.dispensed_quantity },
        },
      });

      // 7️⃣ Update prescription medicine status
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

      // 8️⃣ Update payment amount (increment)
      await tx.payment.update({
        where: {
          id: prescriptionMedicine.prescription.payment_Id,
        },
        data: {
          amount: {
            increment: amount,
          },
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

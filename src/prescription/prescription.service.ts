import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';
import { log } from 'console';

@Injectable()
export class PrescriptionService {
  constructor(private readonly prisma: PrismaService) {}

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
          prescription_no: `MEDI-${Date.now()}`,
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
                connect: {
                  hospital_Id_id: {
                    hospital_Id: Number(dto.hospital_Id),
                    id: Number(med.medicine_Id),
                  },
                },
              },
              batch_No: med.batch_No,
              dosage: med.dosage,
              route: med.route as any,
              frequency: med.frequency,
              days: med.days,
              total_quantity: med.total_quantity,
              after_food: med.afterEat ?? false,
              total_amount: 0,
              morning: med.morning ?? false,
              afternoon: med.afternoon ?? false,
              night: med.night ?? false,
              instructions: med.instructions,
            })),
          },
        },

        include: {
          medicines: {
            include: {
              medicine: true, // ✅ LOAD MEDICINE MASTER
            },
          },
        },
      });
      log('created prescription', prescription);
      return prescription;
    });
  }

  // async medicineAdministarion(id: number, dto: any) {
  //   const prescription = await this.prisma.prescription.update({
  //     where: { id },
  //     data: {
  //       status: dto.status,
  //       medicines: {
  //         updateMany: {
  //           where: { prescription_Id: id },
  //           data: { status: 'COMPLETED' },
  //         },
  //       },
  //     },
  //     include: {
  //       medicines: {
  //         include: { medicine: true },
  //       },
  //     },
  //   });

  //   if (dto.patientType == 'IP') {
  //     const SLOT_TIME = {
  //       MORNING: 10, // before 10 AM
  //       AFTERNOON: 16, // before 4 PM
  //       NIGHT: 22, // before 10 PM
  //     };

  //     const adminRows: any[] = [];
  //     const now = new Date();
  //     const currentHour = now.getHours();
  //     const startDate = new Date(); // admission / prescription date

  //     for (const med of prescription.medicines) {
  //       const days = Math.ceil(Number(med.days || 0));

  //       for (let d = 0; d < days; d++) {
  //         const adminDate = new Date(startDate);
  //         adminDate.setDate(startDate.getDate() + d);

  //         const isToday = d === 0;

  //         // MORNING
  //         if (med.morning) {
  //           if (!isToday || currentHour < SLOT_TIME.MORNING) {
  //             adminRows.push({
  //               hospital_id: Number(dto.hospital_Id),
  //               patient_id: Number(dto.patient_Id),
  //               prescription_id: prescription.id,
  //               prescription_medicine_id: med.id,
  //               medicine_id: med.medicine_Id,
  //               medicine_name: med.medicine?.name ?? '',
  //               dose: med.dosage ?? '',
  //               date: adminDate,
  //               time_slot: 'MORNING',
  //               status: 'PENDING',
  //             });
  //           }
  //         }

  //         // AFTERNOON
  //         if (med.afternoon) {
  //           if (!isToday || currentHour < SLOT_TIME.AFTERNOON) {
  //             adminRows.push({
  //               hospital_id: Number(dto.hospital_Id),
  //               patient_id: Number(dto.patient_Id),
  //               prescription_id: prescription.id,
  //               prescription_medicine_id: med.id,
  //               medicine_id: med.medicine_Id,
  //               medicine_name: med.medicine?.name ?? '',
  //               dose: med.dosage ?? '',
  //               date: adminDate,
  //               time_slot: 'AFTERNOON',
  //               status: 'PENDING',
  //             });
  //           }
  //         }

  //         // NIGHT
  //         if (med.night) {
  //           if (!isToday || currentHour < SLOT_TIME.NIGHT) {
  //             adminRows.push({
  //               hospital_id: Number(dto.hospital_Id),
  //               patient_id: Number(dto.patient_Id),
  //               prescription_id: prescription.id,
  //               prescription_medicine_id: med.id,
  //               medicine_id: med.medicine_Id,
  //               medicine_name: med.medicine?.name ?? '',
  //               dose: med.dosage ?? '',
  //               date: adminDate,
  //               time_slot: 'NIGHT',
  //               status: 'PENDING',
  //             });
  //           }
  //         }
  //       }
  //     }

  //     if (adminRows.length > 0) {
  //       await this.prisma.medicineAdministration.createMany({
  //         data: adminRows,
  //         skipDuplicates: true,
  //       });
  //     }
  //   }
  // }

  // async medicineAdministarion(id: number, dto: any) {
  //   log('medicineAdministarion', id, dto);

  //   // 🔥 Wrap everything in ONE transaction
  //   const result = await this.prisma.$transaction(async (tx) => {
  //     /* ───────── 1️⃣ GET PREVIOUS DISPENSE ───────── */
  //     const prev = await tx.prescriptionDispense.findUnique({
  //       where: { id: dto.dispense_Id },
  //       select: {
  //         dispensed_quantity: true,
  //         dispensed_days: true,
  //         amount: true,
  //         prescription_medicine_Id: true,
  //       },
  //     });
  //     log('prescriptionDispense', prev);

  //     if (!prev) throw new Error('Prescription dispense not found');

  //     const deltaAmount = prev.amount - dto.current_amount;

  //     /* ───────── 2️⃣ UPDATE PRESCRIPTION STATUS ───────── */
  //     const prescription = await tx.prescription.update({
  //       where: { id },
  //       data: { status: dto.status },
  //       include: {
  //         medicines: {
  //           where: { NOT: { status: 'CANCELLED' } },
  //           include: {
  //             dispenses: true,
  //             medicine: true,
  //           },
  //         },
  //       },
  //     });

  //     /* ───────── 3️⃣ UPDATE PRESCRIPTION MEDICINE + DISPENSE ───────── */

  //     log('decre', { decrement: dto.current_quantity });
  //     await tx.prescriptionMedicine.updateMany({
  //       where: {
  //         id: prev.prescription_medicine_Id,
  //       },
  //       data: {
  //         status: 'COMPLETED',
  //         dispensed_quantity: { decrement: dto.current_quantity },
  //       },
  //     });

  //     await tx.prescriptionDispense.update({
  //       where: { id: dto.dispense_Id },
  //       data: {
  //         dispensed_quantity: { decrement: dto.current_quantity },
  //         dispensed_days: { decrement: dto.current_days },
  //         amount: { decrement: dto.current_amount },
  //       },
  //     });

  //     /* ───────── 4️⃣ UPDATE STOCK ───────── */
  //     const batch = await tx.medicineBatch.findUnique({
  //       where: { id: Number(dto.batchNo) },
  //       select: {
  //         medicine_id: true,
  //         hospital_Id: true,
  //       },
  //     });

  //     await tx.payment.update({
  //       where: {
  //         id: prescription.payment_Id,
  //         type: 'MEDICINETONICINJECTIONFEES',
  //       },
  //       data: {
  //         amount: { decrement: deltaAmount },
  //         status: 'PAID'
  //       },
  //     });

  //     if (!batch) throw new Error('Batch not found');

  //     await tx.medicine.updateMany({
  //       where: {
  //         id: batch.medicine_id,
  //         hospital_Id: batch.hospital_Id,
  //       },
  //       data: {
  //         stock: { decrement: dto.current_quantity },
  //       },
  //     });

  //     await tx.medicineBatch.update({
  //       where: { id: Number(dto.batchNo) },
  //       data: {
  //         total_stock: { decrement: dto.current_days },
  //       },
  //     });
  //     log('prescrpyion ', prescription);
  //     return prescription;
  //   });

  //   /* =====================================================
  //    AFTER TRANSACTION → CREATE MEDICINE ADMINISTRATION
  // ===================================================== */

  //   if (dto.patientType !== 'IP') return;

  //   const adminRows: any[] = [];
  //   log('result', [...result.medicines]);
  //   const medicines = [...result.medicines].sort(
  //     (a, b) =>
  //       new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  //   );

  //   const medicineCursor = new Map<number, Date>();

  //   for (const med of medicines) {
  //     const hasSlots = med.morning || med.afternoon || med.night;

  //     // 🔥 USE LATEST DISPENSE ONLY
  //     const latestDispense = med.dispenses?.[0];

  //     const daysToCreate = Number(latestDispense?.dispensed_days || 0) || 1;

  //     let startDate = medicineCursor.get(med.medicine_Id);

  //     if (!startDate) {
  //       const lastAdmin = await this.prisma.medicineAdministration.findFirst({
  //         where: {
  //           prescription_id: result.id,
  //           medicine_id: med.medicine_Id,
  //         },
  //         orderBy: { date: 'desc' },
  //       });

  //       if (lastAdmin) {
  //         startDate = new Date(lastAdmin.date);
  //         startDate.setUTCDate(startDate.getUTCDate() + 1);
  //       } else {
  //         startDate = new Date(med.created_at);
  //       }

  //       startDate.setUTCHours(12, 0, 0, 0);
  //     }

  //     for (let d = 0; d < daysToCreate; d++) {
  //       const adminDate = new Date(startDate);
  //       adminDate.setUTCDate(startDate.getUTCDate() + d);
  //       adminDate.setUTCHours(12, 0, 0, 0);

  //       const baseRow = {
  //         hospital_id: Number(dto.hospital_Id),
  //         patient_id: Number(dto.patient_Id),
  //         prescription_id: result.id,
  //         prescription_medicine_id: med.id,
  //         medicine_id: med.medicine_Id,
  //         medicine_name: med.medicine?.name ?? '',
  //         dose: med.dosage ?? '',
  //         date: adminDate,
  //         status: 'PENDING',
  //       };

  //       if (!hasSlots) {
  //         adminRows.push({ ...baseRow, time_slot: 'NOSLOT' });
  //       } else {
  //         if (med.morning) adminRows.push({ ...baseRow, time_slot: 'MORNING' });
  //         if (med.afternoon)
  //           adminRows.push({ ...baseRow, time_slot: 'AFTERNOON' });
  //         if (med.night) adminRows.push({ ...baseRow, time_slot: 'NIGHT' });
  //       }
  //     }

  //     const nextDate = new Date(startDate);
  //     nextDate.setUTCDate(startDate.getUTCDate() + daysToCreate);
  //     nextDate.setUTCHours(12, 0, 0, 0);

  //     medicineCursor.set(med.medicine_Id, nextDate);
  //   }

  //   if (adminRows.length) {
  //     await this.prisma.medicineAdministration.createMany({
  //       data: adminRows,
  //       skipDuplicates: true,
  //     });
  //   }
  // }

  async medicineAdministarion(id: number, dto: any) {
    log('medicineAdministarion', id, dto);
    const result = await this.prisma.$transaction(async (tx) => {
      /* ───────── 1️⃣ GET PREVIOUS DISPENSE ───────── */
      const prev = await tx.prescriptionDispense.findUnique({
        where: { id: dto.dispense_Id },
        select: {
          dispensed_quantity: true,
          dispensed_days: true,
          amount: true,
          prescription_medicine_Id: true,
        },
      });

      if (!prev) throw new Error('Prescription dispense not found');

      const deltaAmount = prev.amount - dto.current_amount;

      /* ───────── 2️⃣ UPDATE PRESCRIPTION STATUS ───────── */
      const prescription = await tx.prescription.update({
        where: { id },
        data: { status: dto.status },
        include: {
          medicines: {
            where: { id: prev.prescription_medicine_Id },
            include: {
              medicine: true,
            },
          },
        },
      });

      /* ───────── 3️⃣ UPDATE PRESCRIPTION MEDICINE + DISPENSE ───────── */

      const remainingQuantity = prev.dispensed_quantity - dto.current_quantity;

      const deltastatus =
        remainingQuantity > 0 ? 'PARTIALLY_DISPENSED' : 'COMPLETED';

      await tx.prescriptionMedicine.update({
        where: { id: prev.prescription_medicine_Id },
        data: {
          status: deltastatus,
          dispensed_quantity: { decrement: dto.current_quantity },
        },
      });

      await tx.prescriptionDispense.update({
        where: { id: dto.dispense_Id },
        data: {
          dispensed_quantity: { decrement: dto.current_quantity },
          dispensed_days: { decrement: dto.current_days },
          amount: { decrement: dto.current_amount },
        },
      });

      /* ───────── 4️⃣ UPDATE STOCK ───────── */

      const batch = await tx.medicineBatch.findUnique({
        where: { id: Number(dto.batchNo) },
        select: {
          medicine_id: true,
          hospital_Id: true,
        },
      });

      if (!batch) throw new Error('Batch not found');

      await tx.medicine.updateMany({
        where: {
          id: batch.medicine_id,
          hospital_Id: batch.hospital_Id,
        },
        data: {
          stock: { decrement: dto.current_quantity },
        },
      });

      await tx.medicineBatch.update({
        where: { id: Number(dto.batchNo) },
        data: {
          total_stock: { decrement: dto.current_quantity }, // ✅ FIXED (was current_days ❌)
        },
      });

      await tx.payment.update({
        where: {
          id: prescription.payment_Id,
          type: 'MEDICINETONICINJECTIONFEES',
        },
        data: {
          amount: { decrement: deltaAmount },
          //status: 'PAID',
        },
      });

      return prescription;
    });

    //medicine Administration

    if (dto.patientType !== 'IP') return result;

    const med = result.medicines[0];
    if (!med) return result;

    /* ✅ DEFAULT 1 DAY IF 0 OR EMPTY */
    let daysToCreate = Number(dto.current_days);
    if (!daysToCreate || daysToCreate <= 0) {
      daysToCreate = 1;
    }

    const adminRows: any[] = [];

    /* ───────── CONTINUOUS DATE LOGIC ───────── */

    let startDate: Date;

    const lastAdmin = await this.prisma.medicineAdministration.findFirst({
      where: {
        prescription_id: result.id,
        medicine_id: med.medicine_Id,
      },
      orderBy: { date: 'desc' },
    });

    if (lastAdmin) {
      startDate = new Date(lastAdmin.date);
      startDate.setDate(startDate.getDate() + 1);
    } else {
      startDate = new Date();
    }

    /* Normalize time */
    startDate.setHours(0, 0, 0, 0);

    const hasSlots = med.morning || med.afternoon || med.night;

    /* Slot hour configuration */
    const SLOT_HOURS = {
      MORNING: 9,
      AFTERNOON: 15,
      NIGHT: 21,
    };

    const now = new Date();
    const currentHour = now.getHours();

    /* Determine valid slots for FIRST day only */
    let validFirstDaySlots: string[] = [];

    if (med.morning && currentHour < SLOT_HOURS.MORNING)
      validFirstDaySlots.push('MORNING');

    if (med.afternoon && currentHour < SLOT_HOURS.AFTERNOON)
      validFirstDaySlots.push('AFTERNOON');

    if (med.night && currentHour < SLOT_HOURS.NIGHT)
      validFirstDaySlots.push('NIGHT');

    /* If all today's slots passed → shift to tomorrow */
    if (validFirstDaySlots.length === 0) {
      startDate.setDate(startDate.getDate() + 1);
    }

    /* ───────── CREATE ADMIN ROWS ───────── */

    for (let d = 0; d < daysToCreate; d++) {
      const adminDate = new Date(startDate);
      adminDate.setDate(startDate.getDate() + d);

      const baseRow = {
        hospital_id: Number(dto.hospital_Id),
        patient_id: Number(dto.patient_Id),
        prescription_id: result.id,
        prescription_medicine_id: med.id,
        medicine_id: med.medicine_Id,
        medicine_name: med.medicine?.name ?? '',
        dose: med.dosage ?? '',
        date: adminDate,
        status: 'PENDING',
      };

      /* FIRST DAY → only remaining slots */
      if (d === 0 && validFirstDaySlots.length > 0) {
        for (const slot of validFirstDaySlots) {
          adminRows.push({ ...baseRow, time_slot: slot });
        }
      } else {
        /* From next days → create all slots */
        if (!hasSlots) {
          adminRows.push({ ...baseRow, time_slot: 'NOSLOT' });
        } else {
          if (med.morning) adminRows.push({ ...baseRow, time_slot: 'MORNING' });
          if (med.afternoon)
            adminRows.push({ ...baseRow, time_slot: 'AFTERNOON' });
          if (med.night) adminRows.push({ ...baseRow, time_slot: 'NIGHT' });
        }
      }
    }

    /* ───────── SAVE ───────── */

    if (adminRows.length) {
      await this.prisma.medicineAdministration.createMany({
        data: adminRows,
        skipDuplicates: true,
      });
    }

    return result;
  }

  async createPrescriptionAndDispense(dto: CreatePrescriptionDto) {
    return this.prisma.$transaction(
      async (tx) => {
        /* ─────────────────────────────
       1️⃣ FIND OR CREATE PAYMENT
      ───────────────────────────── */
        log('createPrescriptionAndDispense', dto);
        let payment = await tx.payment.findFirst({
          where: {
            hospital_Id: Number(dto.hospital_Id),
            patient_Id: Number(dto.patient_Id),
            consultation_Id: Number(dto.consultation_Id),
            type: 'MEDICINETONICINJECTIONFEES',
            status: 'PENDING',
          },
        });

        if (!payment) {
          payment = await tx.payment.create({
            data: {
              hospital_Id: Number(dto.hospital_Id),
              patient_Id: Number(dto.patient_Id),
              consultation_Id: Number(dto.consultation_Id),
              type: 'MEDICINETONICINJECTIONFEES',
              reason: 'Prescription Fee',
              amount: 0,
              status: 'PENDING',
              createdAt: dto.createdAt ?? new Date(),
            },
          });
        }

        /* ─────────────────────────────
       2️⃣ FIND OR CREATE PRESCRIPTION
      ───────────────────────────── */
        let prescription = await tx.prescription.findFirst({
          where: {
            hospital_Id: Number(dto.hospital_Id),
            patient_Id: Number(dto.patient_Id),
            consultation_Id: Number(dto.consultation_Id),
            status: 'DRAFT',
            is_active: true,
          },
          orderBy: { created_at: 'desc' },
        });

        if (!prescription) {
          prescription = await tx.prescription.create({
            data: {
              hospital_Id: Number(dto.hospital_Id),
              prescription_no: `MEDI-${Date.now()}`,
              patient_Id: Number(dto.patient_Id),
              doctor_Id: dto.doctor_Id.toString(),
              consultation_Id: Number(dto.consultation_Id),
              payment_Id: payment.id,
            },
          });
        }

        /* ─────────────────────────────
       3️⃣ UPSERT PRESCRIPTION MEDICINES
      ───────────────────────────── */
        const existingMeds = await tx.prescriptionMedicine.findMany({
          where: {
            prescription_Id: prescription.id,
            medicine_Id: Number(dto.medicines[0].medicine_Id), // Assuming one medicine per prescription for simplicity
            batch_No: dto.medicines[0].batch_No,
            route: dto.medicines[0].route,
            dosage: dto.medicines[0].dosage,
            after_food: dto.medicines[0].afterEat ?? false,
            morning: dto.medicines[0].morning ?? false,
            afternoon: dto.medicines[0].afternoon ?? false,
            night: dto.medicines[0].night ?? false,
            status: 'PENDING',
          },
        });

        const medMap = new Map(existingMeds.map((m) => [m.medicine_Id, m]));

        for (const med of dto.medicines) {
          const existing = medMap.get(Number(med.medicine_Id));

          const batch = await tx.medicineBatch.findUnique({
            where: {
              hospital_Id_medicine_id_batch_no: {
                hospital_Id: Number(dto.hospital_Id),
                medicine_id: med.medicine_Id,
                batch_no: dto.batch_No,
              },
            },
          });

          const amount = med.total_quantity * batch.selling_price_unit;

          if (existing) {
            // ✅ UPDATE EXISTING MEDICINE
            await tx.prescriptionMedicine.update({
              where: { id: existing.id },
              data: {
                // overwrite normal fields
                dosage: med.dosage,
                route: med.route,
                frequency: med.frequency,
                instructions: med.instructions,

                // 🔢 INCREMENT values
                days: existing.days + (med.days ?? 0),
                total_quantity:
                  existing.total_quantity + (med.total_quantity ?? 0),
                total_amount: existing.total_amount + (amount ?? 0),
                dispensed_quantity:
                  existing.dispensed_quantity + (med.total_quantity ?? 0),
              },
            });
          } else {
            // ✅ CREATE NEW MEDICINE
            await tx.prescriptionMedicine.create({
              data: {
                prescription_Id: prescription.id,
                hospital_Id: Number(dto.hospital_Id),
                medicine_Id: Number(med.medicine_Id),
                dosage: med.dosage,
                route: med.route,
                frequency: med.frequency,
                days: med.days,
                batch_No: med.batch_No,
                total_quantity: med.total_quantity,
                total_amount: amount ?? 0,
                dispensed_quantity: med.total_quantity ?? 0,
                after_food: med.afterEat ?? false,
                morning: med.morning ?? false,
                afternoon: med.afternoon ?? false,
                night: med.night ?? false,
                instructions: med.instructions,
                status: 'PENDING',
              },
            });
          }
        }

        /* ─────────────────────────────
       4️⃣ DISPENSE MEDICINES
      ───────────────────────────── */

        let paymentIncrement = 0;

        const medicinesToDispense = await tx.prescriptionMedicine.findMany({
          where: {
            prescription_Id: prescription.id,
            medicine_Id: Number(dto.medicines[0].medicine_Id), // Assuming one medicine per prescription for simplicity
            batch_No: dto.medicines[0].batch_No,
            route: dto.medicines[0].route,
            dosage: dto.medicines[0].dosage,
            after_food: dto.medicines[0].afterEat ?? false,
            morning: dto.medicines[0].morning ?? false,
            afternoon: dto.medicines[0].afternoon ?? false,
            night: dto.medicines[0].night ?? false,
            status: 'PENDING',
          },
        });

        for (const pm of medicinesToDispense) {
          const batch = await tx.medicineBatch.findUnique({
            where: {
              hospital_Id_medicine_id_batch_no: {
                hospital_Id: Number(dto.hospital_Id),
                medicine_id: pm.medicine_Id,
                batch_no: dto.batch_No,
              },
            },
          });

          if (!batch || batch.quantity < pm.dispensed_quantity) {
            throw new BadRequestException('Insufficient stock');
          }

          const amount = pm.dispensed_quantity * batch.selling_price_unit;

          const existingDispense = await tx.prescriptionDispense.findFirst({
            where: {
              prescription_medicine_Id: pm.id,
              batch_Id: batch.id,
              hospital_Id: Number(dto.hospital_Id),
            },
          });

          if (existingDispense) {
            // 🔑 calculate delta only
            const deltaQty =
              pm.dispensed_quantity - existingDispense.dispensed_quantity;

            if (deltaQty > 0) {
              const deltaAmount = deltaQty * batch.selling_price_unit;

              await tx.prescriptionDispense.update({
                where: { id: existingDispense.id },
                data: {
                  dispensed_quantity: pm.dispensed_quantity,
                  amount: amount,
                  dispensed_by: Number(dto.pharmacist_Id),
                },
              });

              paymentIncrement += deltaAmount;
            }
          } else {
            await tx.prescriptionDispense.create({
              data: {
                hospital: { connect: { id: Number(dto.hospital_Id) } },
                prescriptionMedicine: { connect: { id: pm.id } },
                medicine: {
                  connect: {
                    hospital_Id_id: {
                      hospital_Id: Number(dto.hospital_Id),
                      id: pm.medicine_Id,
                    },
                  },
                },
                batch: { connect: { id: batch.id } },
                dispensed_days: pm.days,
                dispensed_quantity: pm.dispensed_quantity,
                dispensed_by: Number(dto.pharmacist_Id),
                amount,
              },
            });
            paymentIncrement += amount;
          }
          /* ─────────────────────────────
     4️⃣ UPDATE PAYMENT TOTAL
     ───────────────────────────── */
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              amount: { increment: paymentIncrement },
              createdAt: dto.createdAt ?? Date.now(),
            },
          });
        }

        return {
          prescriptionId: prescription.id,
          message: 'Prescription created & medicines dispensed successfully',
        };
      },
      { timeout: 30000 },
    );
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

  async getMedicalPrescription(hospital_Id: number) {
    return await this.prisma.prescription.findMany({
      where: {
        hospital_Id: hospital_Id,
        status: { not: 'CANCELLED' },
        consultation: {
          medicineTonic: true,
          status: {
            notIn: ['ABANDONED', 'CANCELLED', 'DISCHARGED', 'COMPLETED'],
          },
        },
      },
      include: {
        hospital: true,
        patient: true,
        payment: true,
        consultation: {
          include: {
            Doctor: true,
          },
        },
        medicines: {
          include: {
            dispenses: true,
            medicine: {
              include: {
                batches: true,
              },
            },
          },
        },
      },
    });
  }

  // async updatePrescriptionDispenseQuantity(id: number, dispensed_quantity: number, amount: number, batchNo: string) {
  //   log('updatePrescriptionDispenseQuantity', id, dispensed_quantity, amount, batchNo);
  //   const prescription = await this.prisma.prescriptionDispense.updateMany({
  //     where: { id },
  //     data: {
  //       dispensed_quantity: { decrement: dispensed_quantity },
  //       amount: { decrement: amount },
  //     },
  //   });
  //   const getMedicineId = await this.prisma.prescriptionDispense.findUnique({
  //     where: { batchNo },
  //   });

  //   const medicine = await this.prisma.medicine.updateMany({
  //     where: { id: getMedicineId.medicine_Id },
  //     data: {
  //       stock: { decrement: dispensed_quantity},
  //     },
  //     include: {
  //        batches:{
  //         update: {
  //           where: { batch_no: batchNo },
  //           data: {
  //             total_quantity: { decrement: dispensed_quantity },
  //           },
  //         },
  //       },
  //     }

  //     });
  //   }
  // }

  // async updatePrescriptionDispenseQuantity(
  //   id: number,
  //   dispensed_quantity: number,
  //   amount: number,
  //   batchNo: string,
  //   days: number,
  // ) {
  //   return await this.prisma.$transaction(async (tx) => {
  //     log(
  //       'updatePrescriptionDispenseQuantity',
  //       id,
  //       dispensed_quantity,
  //       amount,
  //       batchNo,
  //     );
  //     const perMediDisp = await tx.prescriptionDispense.findFirst({
  //       where: {
  //         id,
  //       },
  //       select: {
  //         amount: true,
  //         dispensed_quantity: true,
  //         dispensed_days: true,
  //         prescription_medicine_Id: true,
  //       },
  //     });
  //     const dispensedQuantity =
  //       perMediDisp.dispensed_quantity - dispensed_quantity; //this patient allocated quantity 30 - current stack 20 => 10 decrease stack 10
  //     const dispensedDays = perMediDisp.dispensed_days - days;
  //     const dispensedAmount = perMediDisp.amount - amount;

  //     // 1️⃣ Update prescription dispense
  //     const prescription = await tx.prescriptionDispense.update({
  //       where: { id },
  //       data: {
  //         dispensed_quantity: { decrement: dispensedQuantity },
  //         dispensed_days: { decrement: dispensedDays },
  //         amount: { decrement: dispensedAmount },
  //       },
  //       select: {
  //         id: true,
  //         prescription_medicine_Id: true,
  //       },
  //     });

  //     const priscritionMedition = await tx.prescriptionMedicine.update({
  //       where: { id: prescription.prescription_medicine_Id },
  //       data: {
  //         dispensed_quantity: { decrement: dispensedQuantity },
  //         status: 'COMPLETED',
  //       },
  //     });

  //     // 2️⃣ Get medicineId from batch
  //     const batch = await tx.medicineBatch.findUnique({
  //       where: { id: Number(batchNo) },
  //       select: {
  //         medicine_id: true,
  //         hospital_Id: true,
  //       },
  //     });

  //     if (!batch) {
  //       throw new Error('Batch not found');
  //     }

  //     // 3️⃣ Update medicine stock
  //     await tx.medicine.updateMany({
  //       where: { id: batch.medicine_id, hospital_Id: batch.hospital_Id },
  //       data: {
  //         stock: { decrement: dispensedQuantity },
  //       },
  //     });

  //     // 4️⃣ Update batch quantity
  //     await tx.medicineBatch.updateMany({
  //       where: {
  //         id: Number(batchNo),
  //         hospital_Id: batch.hospital_Id,
  //         medicine_id: batch.medicine_id,
  //       },
  //       data: {
  //         total_stock: { decrement: dispensedQuantity },
  //       },
  //     });

  //     return {
  //       success: true,
  //       prescriptionId: prescription.id,
  //     };
  //   });
  // }

  async updatePrescriptionDispenseQuantity(
    id: number,
    current_quantity: number, // current stock shown in UI (20)
    current_amount: number,
    batchNo: string,
    current_days: number,
  ) {
    log(
      'quantity',
      id,
      current_amount,
      current_days,
      current_quantity,
      batchNo,
    );
    return await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Fetch existing dispense record
      const prev = await tx.prescriptionDispense.findUnique({
        where: { id },
        select: {
          dispensed_quantity: true, // 30
          dispensed_days: true,
          amount: true,
          prescription_medicine_Id: true,
        },
      });

      if (!prev) {
        throw new Error('Prescription dispense not found');
      }

      // 2️⃣ Calculate DELTA (what actually changed)
      const deltaQuantity = prev.dispensed_quantity - current_quantity;
      const deltaDays = prev.dispensed_days - current_days;
      const deltaAmount = prev.amount - current_amount;

      // 🔒 Safety checks
      if (deltaQuantity <= 0) {
        throw new Error('Invalid dispense quantity');
      }

      // 3️⃣ Update prescription dispense
      const updatedDispense = await tx.prescriptionDispense.update({
        where: { id },
        data: {
          dispensed_quantity: { decrement: deltaQuantity },
          dispensed_days: { decrement: deltaDays },
          amount: { decrement: deltaAmount },
        },
        select: {
          prescription_medicine_Id: true,
        },
      });

      // 4️⃣ Update prescription medicine (SOURCE OF TRUTH)
      await tx.prescriptionMedicine.update({
        where: { id: updatedDispense.prescription_medicine_Id },
        data: {
          dispensed_quantity: { decrement: deltaQuantity },
        },
      });

      // 5️⃣ Get batch info
      const batch = await tx.medicineBatch.findUnique({
        where: { id: Number(batchNo) },
        select: {
          medicine_id: true,
          hospital_Id: true,
        },
      });

      if (!batch) {
        throw new Error('Batch not found');
      }

      // 6️⃣ Update medicine master stock
      // await tx.medicine.update({
      //   where: {
      //     id_hospital_Id: {
      //       id: batch.medicine_id,
      //       hospital_Id: batch.hospital_Id,
      //     },
      //   },
      //   data: {
      //     stock: { decrement: deltaQuantity },
      //   },
      // });

      // // 7️⃣ Update batch stock
      // await tx.medicineBatch.update({
      //   where: { id: Number(batchNo) },
      //   data: {
      //     total_stock: { decrement: deltaQuantity },
      //   },
      // });

      //3️⃣ Update medicine stock
      await tx.medicine.updateMany({
        where: { id: batch.medicine_id, hospital_Id: batch.hospital_Id },
        data: {
          stock: { decrement: deltaQuantity },
        },
      });

      // 4️⃣ Update batch quantity
      await tx.medicineBatch.updateMany({
        where: {
          id: Number(batchNo),
          hospital_Id: batch.hospital_Id,
          medicine_id: batch.medicine_id,
        },
        data: {
          total_stock: { decrement: deltaQuantity },
        },
      });

      return {
        success: true,
        dispensed_now: deltaQuantity,
      };
    });
  }
}

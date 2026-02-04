import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AdmissionStatus, ChargeStatus, PrismaClient } from '@prisma/client';
import { log } from 'console';

const prisma = new PrismaClient();

function formatDateTime(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;

  return `${year}-${month}-${day} ${hours}:${minutes} ${ampm}`;
}

function dateOnlyString(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function getCurrentWardRent(admission: any) {
  // No ward change → original ward rent
  if (
    !Array.isArray(admission.wardChange) ||
    admission.wardChange.length === 0
  ) {
    return admission.bed?.ward?.rent ?? 0;
  }

  // Latest ward change
  const lastChange = admission.wardChange[admission.wardChange.length - 1];
  const wardId = lastChange?.toWard?.wardId;

  if (!wardId) {
    return admission.bed?.ward?.rent ?? 0;
  }

  const ward = await prisma.wards.findUnique({
    where: { id: wardId },
    select: { rent: true },
  });

  return ward?.rent ?? 0;
}

@Injectable()
export class AdmissionService {
  private readonly logger = new Logger(AdmissionService.name);
  // async changeAssignment(
  //   admissionId: number,
  //   data: { newBedId?: number },
  //   hospital_Id: number,
  // ) {
  //   return prisma.$transaction(async (tx) => {
  //     const admission = await tx.admission.findFirst({
  //       where: { id: admissionId, hospital_Id },
  //       include: {
  //         bed: { include: { ward: true } },
  //       },
  //     });

  //     if (!admission) {
  //       throw new BadRequestException('Admission not found');
  //     }

  //     if (!data.newBedId || data.newBedId === admission.bedId) {
  //       return admission;
  //     }

  //     const newBed = await tx.bed.findFirst({
  //       where: { id: data.newBedId, status: 'AVAILABLE' },
  //       include: { ward: true },
  //     });

  //     if (!newBed) {
  //       throw new BadRequestException('Selected bed not available');
  //     }

  //     const now = new Date();

  //     // ✅ Preserve existing history
  //     const wardHistory: any[] = Array.isArray(admission.wardChange)
  //       ? [...admission.wardChange]
  //       : [];

  //     // ✅ Add new movement entry
  //     wardHistory.push({
  //       movedAt: now.toISOString(),
  //       fromWard: {
  //         wardId: admission.bed.ward.id,
  //         wardName: admission.bed.ward.name,
  //         bedId: admission.bed.id,
  //         bedNo: admission.bed.bedNo,
  //       },
  //       toWard: {
  //         wardId: newBed.ward.id,
  //         wardName: newBed.ward.name,
  //         bedId: newBed.id,
  //         bedNo: newBed.bedNo,
  //       },
  //     });

  //     // 🔄 Free old bed
  //     await tx.bed.update({
  //       where: { id: admission.bedId },
  //       data: { status: 'AVAILABLE' },
  //     });

  //     // 🔒 Occupy new bed
  //     await tx.bed.update({
  //       where: { id: newBed.id },
  //       data: { status: 'OCCUPIED' },
  //     });

  //     // 💾 Save updated history
  //     return tx.admission.update({
  //       where: { id: admissionId },
  //       data: {
  //         bedId: newBed.id,
  //         wardChange: wardHistory,
  //       },
  //       include: {
  //         patient: true,
  //         bed: { include: { ward: true } },
  //       },
  //     });
  //   });
  // }

  async changeAssignment(
    admissionId: number,
    data: { newBedId?: number },
    hospital_Id: number,
  ) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.findFirst({
        where: { id: admissionId, hospital_Id },
        include: {
          bed: { include: { ward: true } },
        },
      });

      if (!admission) {
        throw new BadRequestException('Admission not found');
      }

      if (!data.newBedId || data.newBedId === admission.bedId) {
        return admission;
      }

      const newBed = await tx.bed.findFirst({
        where: { id: data.newBedId, status: 'AVAILABLE' },
        include: { ward: true },
      });

      if (!newBed) {
        throw new BadRequestException('Selected bed not available');
      }

      const oldWardId = admission.bed.ward.id;
      const newWardId = newBed.ward.id;

      // 🕖 Billing date logic (after 7 PM → next day)
      const now = new Date();
      const billingStartDate = new Date(now);

      if (now.getHours() >= 19) {
        billingStartDate.setDate(billingStartDate.getDate() + 1);
      }

      billingStartDate.setHours(0, 0, 0, 0);
      const billingDay = billingStartDate.toISOString().split('T')[0];

      // 📜 Preserve ward history
      const wardHistory: any[] = Array.isArray(admission.wardChange)
        ? [...admission.wardChange]
        : [];

      // 🔍 Check if this WARD was already entered today
      const alreadyEnteredThisWardToday = wardHistory.some((entry) => {
        const moveDate = entry.movedAt.split('T')[0];
        return moveDate === billingDay && entry.toWard?.wardId === newWardId;
      });

      // ➕ Add ward movement history
      wardHistory.push({
        movedAt: now.toISOString(),
        fromWard: {
          wardId: oldWardId,
          wardName: admission.bed.ward.name,
          bedId: admission.bed.id,
          bedNo: admission.bed.bedNo,
        },
        toWard: {
          wardId: newWardId,
          wardName: newBed.ward.name,
          bedId: newBed.id,
          bedNo: newBed.bedNo,
        },
      });

      // 💰 Create charge ONLY if:
      // 1️⃣ Ward changed
      // 2️⃣ Ward not already charged today
      log({
        oldWardId,
        newWardId,
        alreadyEnteredThisWardToday,
      });
      log(
        'Condition:',
        oldWardId !== newWardId && !alreadyEnteredThisWardToday,
      );
      log(
        'History:',
        wardHistory.filter((entry) => entry.toWard?.wardId === newWardId),
      );

      if (oldWardId !== newWardId && !alreadyEnteredThisWardToday) {
        await tx.charge.create({
          data: {
            admissionId: admission.id,
            description: 'Room Rent',
            chargeDate: billingStartDate,
            amount: newBed.ward.rent,
            status: 'PENDING',
          },
        });
      }

      await tx.payment.updateMany({
        where: {
          admission_Id: admissionId,
          type: 'DAILYTREATMENTFEE',
          status: 'PENDING',
        },
        data: {
          amount: {
            increment: newBed.ward.rent,
          },
        },
      });

      // 🔄 Free old bed
      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      // 🔒 Occupy new bed
      await tx.bed.update({
        where: { id: newBed.id },
        data: { status: 'OCCUPIED' },
      });

      // 💾 Save admission
      return tx.admission.update({
        where: { id: admissionId },
        data: {
          bedId: newBed.id,
          wardChange: wardHistory,
        },
        include: {
          patient: true,
          bed: { include: { ward: true } },
        },
      });
    });
  }

  //============================================================================
  async addStaffChange(admissionId: number, incoming: any) {
    log('Adding staff change for admission:', admissionId, incoming);
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      select: { staffChange: true, id: true, consultation_Id: true },
    });

    if (!admission) {
      throw new NotFoundException('Admission not found');
    }

    const history: any[] = Array.isArray(admission.staffChange)
      ? admission.staffChange
      : [];

    const last = history.length > 0 ? history[history.length - 1] : null;
    log('Last staff change entry:', last);
    log(!last && (!incoming.doctor || !incoming.nurse));
    // 🛑 First record must be complete
    if (!last && (!incoming.doctor || !incoming.nurse)) {
      throw new BadRequestException(
        'First staff change must include doctor and nurse',
      );
    }

    const entry = Array.isArray(incoming) ? incoming[0] : incoming;

    const doctor = entry.doctor;
    const nurse = entry.nurse;
    const dateTime = entry.dateTime;
    log('Comparing with last entry:', { doctor, nurse });
    log(last && last.doctor === doctor && last.nurse === nurse);
    // 🚫 nothing changed
    if (last && last.doctor === doctor && last.nurse === nurse) {
      return admission;
    }
    if (last.doctor !== doctor && doctor != null && last.doctor != null) {
      const consultation = await prisma.consultation.update({
        where: { id: admission.consultation_Id },
        data: { doctor_Id: doctor },
      });
      log('Consultation doctor updated:', consultation);
    }
    const newEntry = {
      doctor,
      nurse,
      dateTime: dateTime ?? new Date().toISOString(),
    };
    log('New staff change entry:', newEntry);
    return prisma.admission.update({
      where: { id: admissionId },
      data: {
        staffChange: [...history, newEntry],
      },
    });
  }

  async findById(id: number, hospital_Id: number) {
    return prisma.patient.findFirst({
      where: {
        id,
        hospital_Id,
      },
      include: {
        Consultation: true,
      },
    });
  }

  async findAllPatients(hospital_Id: number) {
    return prisma.patient.findMany({
      where: {
        hospital_Id,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getAdmittedAdmissions(hospital_Id: number) {
    return prisma.admission.findMany({
      where: {
        hospital_Id,
        status: 'ADMITTED',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        bed: {
          include: {
            ward: true,
          },
        },
        consultation: true,
      },
      orderBy: {
        admitTime: 'desc',
      },
    });
  }

  async admitPatient(dto: any, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      // 🔴 Required fields
      if (!dto.patientId || !dto.bedId) {
        throw new BadRequestException('Patient and Bed are required');
      }

      // 🔍 Ensure patient exists (read-only)
      const patient = await tx.patient.findFirst({
        where: {
          hospital_Id,
          id: dto.patientId,
        },
        select: { id: true },
      });

      if (!patient) {
        throw new BadRequestException('Patient not found');
      }

      // 🚫 Prevent multiple active admissions
      const existingAdmission = await tx.admission.findFirst({
        where: {
          patient_Id: dto.patientId,
          hospital_Id,
          status: 'ADMITTED',
        },
        select: { id: true },
      });

      if (existingAdmission) {
        throw new BadRequestException('Patient already admitted');
      }

      // 🛏 Bed availability check
      const bed = await tx.bed.findFirst({
        where: {
          id: dto.bedId,
          status: 'AVAILABLE',
        },
      });

      const wardAmount = await tx.wards.findFirst({
        where: {
          id: bed.wardId,
        },
      });

      if (!bed) {
        throw new BadRequestException('Bed not available');
      }
      const consultation = await tx.consultation.findFirst({
        where: {
          patient_Id: dto.patientId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // 🔴 Closed consultation → proper message
      if (
        ['COMPLETED', 'CANCELLED', 'ABANDONED', 'DISCHARGED'].includes(
          consultation.status,
        )
      ) {
        throw new BadRequestException(
          `This patient’s consultation is already closed (status: ${consultation.status}). A new consultation must be created before admission.`,
        );
      }

      log('Consultation Updatedhhh: %o', consultation.id);
      if (consultation.paymentStatus == false) {
        throw new BadRequestException(
          'Patient cannot be admitted until the registration fee is paid',
        );
      }
      if (!consultation) {
        throw new BadRequestException(
          'Patient must have an active consultation before admission',
        );
      }

      const consultations = await tx.consultation.update({
        where: { id: consultation.id },
        data: { patientType: 'IP' },
      });

      // 🏥 Create admission
      const admission = await tx.admission.create({
        data: {
          hospital_Id,
          patient_Id: dto.patientId,
          bedId: dto.bedId,
          attenderDetail: dto.admitBy ?? null,
          consultation_Id: consultation.id,
          // ✅ always an array
          staffChange: Array.isArray(dto.staffChange) ? dto.staffChange : [],
        },
      });
      log('Consultation Updated: %o', consultations);
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      const now = new Date();
      const billingStartDate = new Date(now);
      if (now.getHours() >= 19) {
        billingStartDate.setDate(billingStartDate.getDate() + 1);
      }
      billingStartDate.setHours(0, 0, 0, 0);
      if (dto.isAdvanced === true) {
        const advancedFee = await prisma.fees.findFirst({
          where: {
            hospital_Id: Number(hospital_Id),
            type: 'INPATIENT ADVANCE FEE',
          },
        });
        const hasValidAdvanceFee =
          advancedFee !== null && advancedFee.amount > 0;

        if (!hasValidAdvanceFee) {
          throw new BadRequestException('Please Set Inpatient Advanced Fee');
        }
        await tx.charge.create({
          data: {
            admissionId: admission.id,
            description: 'Inpatient Advance Fee',
            chargeDate: billingStartDate,
            amount: advancedFee.amount,
            status: 'PENDING',
          },
        });
        const payment = await tx.payment.create({
          data: {
            hospital_Id: hospital_Id,
            patient_Id: dto.patientId,
            //consultation_Id: consultation.id,
            admission_Id: admission.id,
            reason: 'Inpatient Advance Fee',
            status: 'PENDING',
            amount: advancedFee?.amount ?? 0,
            type: 'ADVANCEFEE',
            createdAt: dto.createdAt || new Date(),
          },
          include: {
            Admission: {
              include: { charges: true },
            },
          },
        });
      }

      const DoctorFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: Number(hospital_Id),
          type: 'INPATIENT DOCTOR FEE',
        },
      });

      const NurseFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: Number(hospital_Id),
          type: 'INPATIENT NURSE FEE',
        },
      });

      if (
        !DoctorFee?.amount ||
        DoctorFee.amount <= 0 ||
        !NurseFee?.amount ||
        NurseFee.amount <= 0
      ) {
        throw new BadRequestException(
          'Please set inpatient doctor and nurse fees',
        );
      }

      await prisma.charge.createMany({
        data: [
          {
            admissionId: admission.id,
            description: 'Room Rent',
            chargeDate: billingStartDate,
            amount: wardAmount.rent,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Doctor Fee',
            chargeDate: billingStartDate,
            amount: DoctorFee.amount ?? 0,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Nurse Fee',
            chargeDate: billingStartDate,
            amount: NurseFee.amount ?? 0,
            status: 'PENDING',
          },
        ],
      });

      // 🔒 Occupy bed
      await tx.bed.update({
        where: { id: dto.bedId },
        data: { status: 'OCCUPIED' },
      });

      // 📦 Return admission
      return tx.admission.findUnique({
        where: { id: admission.id },
        include: {
          patient: true,
          bed: {
            include: { ward: true },
          },
          payments: true,
        },
      });
    });
  }

  async createChargesFromPayments() {
    const now = new Date();

    const payments = await prisma.payment.findMany({
      where: {
        type: 'DAILYTREATMENTFEE',
        Admission: {
          status: 'ADMITTED',
          dischargeTime: null,
        },
      },
      include: {
        Admission: {
          include: {
            bed: {
              include: {
                ward: true,
              },
            },
          },
        },
      },
    });

    log('Found payments for daily charges:', payments);

    for (const payment of payments) {
      const admission = payment.Admission;
      if (!admission) continue;

      // 🔹 Date-only boundaries (per loop = safest)
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // 🔒 avoid duplicate charges for the same date
      const exists = await prisma.charge.findFirst({
        where: {
          admissionId: admission.id,
          chargeDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (exists) continue;

      const doctorFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: admission.hospital_Id,
          type: 'INPATIENT DOCTOR FEE',
        },
      });

      const nurseFee = await prisma.fees.findFirst({
        where: {
          hospital_Id: admission.hospital_Id,
          type: 'INPATIENT NURSE FEE',
        },
      });

      // ✅ Update only THIS admission's payment
      await prisma.payment.updateMany({
        where: {
          admission_Id: admission.id,
          type: 'DAILYTREATMENTFEE',
          status: 'PENDING',
        },
        data: {
          status: 'PAYLATER',
          updatedAt: formatDateTime(new Date()),
        },
      });
      const wardRent = await getCurrentWardRent(admission);

      // 🧾 Create today's charges
      await prisma.charge.createMany({
        data: [
          {
            admissionId: admission.id,
            description: 'Room Rent',
            chargeDate: now,
            amount: wardRent,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Doctor Fee',
            chargeDate: now,
            amount: doctorFee?.amount ?? 0,
            status: 'PENDING',
          },
          {
            admissionId: admission.id,
            description: 'Nurse Fee',
            chargeDate: now,
            amount: nurseFee?.amount ?? 0,
            status: 'PENDING',
          },
        ],
      });
    }
  }

  async createDailyPayment() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = dateOnlyString(today);
    const yesterdayStr = dateOnlyString(yesterday);

    const admissions = await prisma.admission.findMany({
      where: {
        status: 'ADMITTED',
        dischargeTime: null,
        //hospital_Id: 1,
      },
    });

    for (const admission of admissions) {
      // 🔹 Fetch ALL daily payments once
      const payments = await prisma.payment.findMany({
        where: {
          type: 'DAILYTREATMENTFEE',
          admission_Id: admission.id,
        },
      });
      // log('pay1',payments);

      let todayPayment: any = null;
      let yesterdayPayment: any = null;

      for (const p of payments) {
        const date = p.createdAt.substring(0, 10);
        if (date === todayStr) todayPayment = p;
        if (date === yesterdayStr) yesterdayPayment = p;
      }

      // ✅ RULE 1: If today exists → SKIP

      if (todayPayment) {
        continue;
      }

      // 🔹 Get pending charges only if needed
      const charges = await prisma.charge.findMany({
        where: {
          admissionId: admission.id,
          status: 'PENDING',
          NOT: { description: 'Inpatient Advance Fee' },
        },
      });
      if (!charges.length) continue;

      const totalAmount = charges.reduce((sum, c) => sum + Number(c.amount), 0);

      // ✅ RULE 2: Yesterday PAID → CREATE today

      if (yesterdayPayment && yesterdayPayment.status === 'PAID') {
        await prisma.payment.create({
          data: {
            hospital_Id: admission.hospital_Id,
            patient_Id: admission.patient_Id,
            admission_Id: admission.id,
            reason: 'Inpatient Daily Fee',
            amount: totalAmount,
            status: 'PENDING',
            type: 'DAILYTREATMENTFEE',
            createdAt: formatDateTime(new Date()),
          },
        });
        continue;
      }

      // ❌ RULE 3: Yesterday NOT PAID → UPDATE yesterday

      if (yesterdayPayment) {
        await prisma.payment.update({
          where: { id: yesterdayPayment.id },
          data: {
            amount: totalAmount,
            status: 'PENDING',
            createdAt: formatDateTime(new Date()),
          },
        });
      }
      // ❌ RULE 4: no Yesterday create
      if (!yesterdayPayment) {
        await prisma.payment.create({
          data: {
            hospital_Id: admission.hospital_Id,
            patient_Id: admission.patient_Id,
            admission_Id: admission.id,
            reason: 'Inpatient Daily Fee',
            amount: totalAmount,
            status: 'PENDING',
            type: 'DAILYTREATMENTFEE',
            createdAt: formatDateTime(new Date()),
          },
        });
        continue;
      }
    }
  }
  async dischargeAdmission(admissionId: number) {
    const now = new Date();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 1️⃣ Discharge admission
    const admission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: 'DISCHARGED',
        dischargeTime: now,
        bed: {
          update: { status: 'AVAILABLE' },
        },
      },
    });

    const consultation = await prisma.consultation.update({
      where: { id: admission.consultation_Id },
      data: {
        status: 'DISCHARGED',
        updatedAt: new Date().toDateString(),
      },
    });

    // 2️⃣ Find today's NON-PAID daily treatment fee
    const dailyPayment = await prisma.payment.findFirst({
      where: {
        admission_Id: admissionId,
        type: 'DAILYTREATMENTFEE',
        status: { not: 'PAID' },
        createdAt: {
          gte: dateOnlyString(startOfDay),
          lte: dateOnlyString(endOfDay),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3️⃣ Get PENDING charges (exclude advance)
    const charges = await prisma.charge.findMany({
      where: {
        admissionId,
        //status: 'PENDING',
        NOT: { description: 'Inpatient Advance Fee' },
      },
    });

    // 4️⃣ Get PAID advance fee
    const advanceCharges = await prisma.charge.findMany({
      where: {
        admissionId,
        status: 'PAID',
        description: 'Inpatient Advance Fee',
      },
    });
    const totalCharges = charges.reduce((sum, c) => sum + Number(c.amount), 0);

    const totalAdvance = advanceCharges.reduce(
      (sum, c) => sum + Number(c.amount),
      0,
    );

    // 🔴 NET payable (can be negative)
    const netAmount =
      totalAdvance > totalCharges
        ? totalAdvance - totalCharges
        : totalCharges - totalAdvance;

    log('netAmount', totalCharges);

    // 🧮 Final discharge amount
    //const finalAmount = Math.max(totalCharges - totalAdvance, 0);

    // 5️⃣ Update existing daily payment → discharge fee
    if (dailyPayment) {
      await prisma.payment.update({
        where: { id: dailyPayment.id },
        data: {
          type: 'DISCHARGEFEE',
          status: 'PENDING',
          amount: totalCharges,
          createdAt: formatDateTime(new Date()),
          updatedAt: formatDateTime(new Date()),
        },
      });

      return {
        status: 'success',
        message: 'Patient discharged with discharge fee updated',
        amount: totalCharges,
      };
    }

    // 6️⃣ Create new discharge fee
    await prisma.payment.create({
      data: {
        hospital_Id: admission.hospital_Id,
        patient_Id: admission.patient_Id,
        admission_Id: admissionId,
        type: 'DISCHARGEFEE',
        reason: 'Inpatient Discharge Fee',
        amount: totalCharges,
        status: 'PENDING',
        createdAt: formatDateTime(new Date()),
      },
    });

    return {
      status: 'success',
      message: 'Patient discharged and discharge fee created',
      amount: totalCharges,
    };
  }

  async getNurses(hospital_Id: number) {
    return prisma.admin.findMany({
      where: { hospital_Id, role: 'NURSE', status: 'ACTIVE' },
    });
  }

  async getDoctors(hospital_Id: number) {
    return prisma.admin.findMany({
      where: { hospital_Id, role: 'DOCTOR', status: 'ACTIVE' },
    });
  }

  getAllAdmissions(hospital_Id: number) {
    return prisma.admission.findMany({
      include: {
        patient: true,
        bed: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAdmissionById(id: number, hospital_Id: number) {
    return prisma.admission.findUnique({
      where: { id, hospital_Id },
      include: {
        patient: true,
        bed: true,
      },
    });
  }

  async updateAdmission(id: number, data: any, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.update({
        where: { id, hospital_Id },
        data,
        include: {
          patient: true,
          bed: true,
        },
      });

      if (data.status === 'DISCHARGED') {
        await tx.bed.update({
          where: { id: admission.bedId },
          data: { status: 'AVAILABLE' },
        });
      }

      return admission;
    });
  }

  async findByPhone(phone: string, hospital_Id: number) {
    return prisma.patient.findMany({
      where: {
        hospital_Id,
        user_Id: phone,
        // phone: {
        //   path: '$',
        //   array_contains: phone,
        // },
      },
      include: {
        Consultation: true,
      },
    });
  }

  async updateStatus(admissionId: number, dto: { status: AdmissionStatus }) {
    return prisma.$transaction([
      prisma.admission.update({
        where: { id: admissionId },
        data: {
          status: dto.status,
          updatedAt: new Date(),
        },
      }),
      prisma.charge.updateMany({
        where: { admissionId },
        data: {
          status: ChargeStatus.CANCELLED,
          updatedAt: new Date(),
        },
      }),
    ]);
  }

  async deleteAdmission(id: number, hospital_Id: number) {
    return prisma.$transaction(async (tx) => {
      const admission = await tx.admission.delete({
        where: { id, hospital_Id },
      });

      await tx.bed.update({
        where: { id: admission.bedId },
        data: { status: 'AVAILABLE' },
      });

      return admission;
    });
  }
}

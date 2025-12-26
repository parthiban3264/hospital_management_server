import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultationGateway } from './consultation.gateway';
import { QueueStatus } from '@prisma/client';
import { log } from 'console';

@Injectable()
export class ConsultationService {
  constructor(
    private prisma: PrismaService,
    private gateway: ConsultationGateway,
  ) {}

  // async create(data: any) {
  //   try {
  //     const consultation = await this.prisma.consultation.create({
  //       data,
  //     });
  //     return { status: "success", message: "Consultation created", data: consultation };
  //   } catch (error) {
  //     return { status: "failed", error: error.message };
  //   }
  // }

  // async create(data: any) {
  //   try {
  //     console.log('Creating consultation with data:', data);

  //     // ---- Fetch Fees ----
  //     const registrationFee = await this.prisma.fees.findFirst({
  //       where: {
  //         hospital_Id: Number(data.hospital_Id),
  //         type: 'REGISTRATION FEE',
  //       },
  //     });

  //     const sugarFee = await this.prisma.fees.findFirst({
  //       where: {
  //         hospital_Id: Number(data.hospital_Id),
  //         type: 'SUGAR FEE',
  //       },
  //     });

  //     const emergencyFee = await this.prisma.fees.findFirst({
  //       where: {
  //         hospital_Id: Number(data.hospital_Id),
  //         type: 'EMERGENCY FEE',
  //       },
  //     });

  //     // ---- Fetch Doctor Amount ----
  //     const doctorData = await this.prisma.admin.findFirst({
  //       where: {
  //         hospital_Id: Number(data.hospital_Id),
  //         user_Id: data.doctor_Id,
  //       },
  //     });

  //     const doctorAmount = doctorData?.doctorAmount ?? 0;

  //     // ---- Extract Fee Amounts ----
  //     const regAmount = registrationFee?.amount ?? 0;
  //     const emergencyAmount = emergencyFee?.amount ?? 0;
  //     const sugarAmount = sugarFee?.amount ?? 0;

  //     // ---- If both fees missing, show message ----
  //     if (!regAmount) {
  //       return {
  //         status: 'failed',
  //         message:
  //           '⚠️ Registration Fee or Appointment Fee is not set! Please assign Registration Fees after register.',
  //       };
  //     }
  //     console.log('wokkkk',data.emergency,data.sugarTest);

  //     if (data.emergency === true) {
  //       regAmount + emergencyAmount;
  //     }
  //     if (data.sugarTest === true) {
  //       regAmount + sugarAmount;
  //     }
      

  //     // Step 1️⃣ - Create consultation
  //     const consultation = await this.prisma.consultation.create({
  //       data: {
  //         hospital_Id: Number(data.hospital_Id),
  //         patient_Id: data.patient_Id,
  //         doctor_Id: data.doctor_Id,
  //         purpose: data.purpose,
  //         symptoms: data.symptoms,
  //         consultationFee: doctorAmount,
  //         bp: data.bp,
  //         weight: data.weight,
  //         height: data.height,
  //         sugar: data.sugar,
  //         emergency: data.emergency,
  //         sugerTest: data.sugarTest,
  //         temperature: data.temperature,
  //         notes: data.notes ? JSON.parse(data.notes) : null,
  //         paymentStatus: data.paymentStatus === true,
  //         createdAt: data.createdAt || new Date().toISOString(),
  //       },
  //     });
  //     log('Consultation created:', consultation);

  //     // ---- Fee Logic ----
  //     // Priority:
  //     // 1. If appointment fee > 0 → use appointment fee
  //     // 2. Else if registration fee > 0 → use registration fee
  //     // 3. Else → 0
  //     let baseFee = 0;

  //     if (regAmount > 0) {
  //       baseFee = regAmount;
  //     }else {
  //       baseFee = 0;
  //     }

  //     // ---- Final total ----
  //     const totalFeeAmount = baseFee + doctorAmount;

  //     // Step 2️⃣ - Create payment linked to consultation
  //     const payment = await this.prisma.payment.create({
  //       data: {
  //         hospital_Id: Number(data.hospital_Id),
  //         patient_Id: data.patient_Id,
  //         consultation_Id: consultation.id, // ✅ works now
  //         reason: data.title ?? 'Registration Fee',
  //         status: 'PENDING',
  //         amount: totalFeeAmount,
  //         type: 'REGISTRATIONFEE',
  //         createdAt: data.createdAt || new Date().toISOString(),
  //       },
  //     });

  //     // Step 3️⃣ - Return response
  //     return {
  //       status: 'success',
  //       data: {
  //         consultationId: consultation.id,
  //         paymentId: payment.id,
  //       },
  //     };
  //   } catch (e) {
  //     console.error(e);
  //     return { status: 'failed', error: e.message };
  //   }
  // }

  async create(data: any) {
  try {
    console.log('Creating consultation with data:', data);

    // -------------------- FETCH FEES -------------------- //
    const registrationFee = await this.prisma.fees.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        type: 'REGISTRATION FEE',
      },
    });

    const emergencyFee = await this.prisma.fees.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        type: 'EMERGENCY FEE',
      },
    });

    const sugarFee = await this.prisma.fees.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        type: 'SUGAR FEE',
      },
    });

    // -------------------- FETCH DOCTOR FEE -------------------- //
    const doctorData = await this.prisma.admin.findFirst({
      where: {
        hospital_Id: Number(data.hospital_Id),
        user_Id: data.doctor_Id,
      },
    });

    const doctorAmount = doctorData?.doctorAmount ?? 0;

    // -------------------- AMOUNTS -------------------- //
    const regAmount = registrationFee?.amount ?? 0;
    const emergencyAmount = emergencyFee?.amount ?? 0;
    const sugarAmount = sugarFee?.amount ?? 0;

    // -------------------- VALIDATION -------------------- //
    if (!regAmount) {
      return {
        status: 'failed',
        message:
          '⚠️ Registration Fee is not set! Please assign Registration Fee first.',
      };
    }

    // -------------------- CALCULATE TOTAL REGISTRATION PAYMENT -------------------- //
    let totalRegistrationAmount = regAmount + doctorAmount;

    if (data.emergency === true) {
      totalRegistrationAmount += emergencyAmount;
    }

    if (data.sugarTest === true) {
      totalRegistrationAmount += sugarAmount;
    }

    // -------------------- CREATE CONSULTATION -------------------- //
    const consultation = await this.prisma.consultation.create({
      data: {
        hospital_Id: Number(data.hospital_Id),
        patient_Id: data.patient_Id,
        doctor_Id: data.doctor_Id,
        purpose: data.purpose,
        symptoms: data.symptoms,

        consultationFee: doctorAmount, // ✅ ONLY doctor fee

        bp: data.bp,
        weight: data.weight,
        height: data.height,
        sugar: data.sugar,
        emergency: data.emergency === true,
        sugerTest: data.sugarTest === true,
        temperature: data.temperature,

        notes: data.notes ? JSON.parse(data.notes) : null,
        paymentStatus: false,
        createdAt: data.createdAt || new Date(),
      },
    });

    console.log('Consultation created:', consultation.id);

    // -------------------- CREATE PAYMENT -------------------- //
    const payment = await this.prisma.payment.create({
      data: {
        hospital_Id: Number(data.hospital_Id),
        patient_Id: data.patient_Id,
        consultation_Id: consultation.id,

        reason: 'Registration Fee',
        status: 'PENDING',

        amount: totalRegistrationAmount, // ✅ ALL fees combined

        type: 'REGISTRATIONFEE',
        createdAt: data.createdAt || new Date(),
      },
    });

    // -------------------- SUCCESS RESPONSE -------------------- //
    return {
      status: 'success',
      data: {
        consultationId: consultation.id,
        paymentId: payment.id,
        totalAmount: totalRegistrationAmount,
      },
    };
  } catch (error) {
    console.error('Create consultation error:', error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}


  async findAll() {
    const consultations = await this.prisma.consultation.findMany({
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
      },
    });
    return {
      status: 'success',
      message: 'Consultations fetched',
      data: consultations,
    };
  }

  async findAllByHospitalOverview(hospitalId: number) {
    return this.prisma.consultation.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: {
          in: ['PENDING', 'ENDPROCESSING', 'ONGOING', 'CANCELLED', 'COMPLETED'],
        },
      }, //,'COMPLETED' assuming hospitalId is numeric
      include: {
        Hospital: true,
        Patient: {
          include: {
            TestingAndScanning: true,
          },
        },
        Doctor: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findAllByHospitalDrQueue(hospitalId: number) {
    // Step 1️⃣: Fetch consultations
    const consultations = await this.prisma.consultation.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: { in: ['PENDING', 'ENDPROCESSING', 'ONGOING'] },
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            user_Id: true,
            name: true,
            gender: true,
            phone: true,
            dob: true,
            bldGrp: true,
            address: true,
            createdAt: true,
            updatedAt: true,
            // TestingAndScanning: true,
          },
        },
        Doctor: { select: { user_Id: true, name: true, specialist: true } },
        TeatingAndScanningPatient: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Step 2️⃣: Fetch unit/reference info
    const unitRefs = await this.prisma.scanAndTestUnitReferance.findMany({
      select: { optionName: true, unit: true, referance: true },
    });

    // Step 3️⃣: Helper functions
    const calculateAgeInMonths = (dob: string | Date | null) => {
      if (!dob) return 0;
      const birth = new Date(dob);
      const now = new Date();
      return (
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth())
      );
    };

    const getReferenceForPatient = (
      refJson: any,
      ageMonths: number,
      gender: string,
    ) => {
      if (!refJson) return 'N/A';
      let parsed;
      try {
        parsed = typeof refJson === 'string' ? JSON.parse(refJson) : refJson;
      } catch {
        return 'N/A';
      }
      const genderKey = gender?.toLowerCase().startsWith('f') ? 'f' : 'm';
      for (const key of Object.keys(parsed)) {
        const [minStr, maxStr, g] = key.split('_');
        const min = parseInt(minStr, 10);
        const max = parseInt(maxStr, 10);
        if (
          ageMonths >= min &&
          ageMonths <= max &&
          g.toLowerCase() === genderKey
        ) {
          return parsed[key];
        }
      }
      return 'N/A';
    };

    // Step 4️⃣: Transform TestingAndScanning data

    const formatted = consultations.map((c) => {
      const patient = c.Patient;
      const TeatingAndScanningPatient = c.TeatingAndScanningPatient;
      const ageMonths = calculateAgeInMonths(patient.dob);

      return {
        id: c.id,
        patient_Id: c.patient_Id,
        hospital_Id: c.hospital_Id,
        purpose: c.purpose,
        status: c.status,
        queueStatus: c.queueStatus,
        symptoms: c.symptoms,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        medicineTonic: c.medicineTonic,
        Injection: c.Injection,
        scanningTesting: c.scanningTesting,
        paymentStatus: c.paymentStatus,
        height: c.height,
        weight: c.weight,
        bp: c.bp,
        sugar: c.sugar,
        temperature: c.temperature,
        BMI: c.BMI,
        SPO2: c.SPO2,
        PK: c.PK,
        notes: c.notes,
        Patient: {
          patient_Id: patient.user_Id,
          name: patient.name,
          dob: patient.dob,
          phone:
            typeof patient.phone === 'object' && patient.phone
              ? ((patient.phone as any).mobile ?? '-')
              : '-',
          gender: patient.gender,
          bldGrp: patient.bldGrp,
          address: patient.address ?? {},
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
        },
        TeatingAndScanningPatient: (TeatingAndScanningPatient || [])
          .filter((t) => t.status === 'COMPLETED' && t.consultation_Id === c.id)
          .map((t) => ({
            title: t.title,
            type: t.type,
            staff_Id: t.staff_Id,
            status: t.status,
            scanImages: t.scanImages,
            results: t.result,
            selectedOptions: (Array.isArray(t.selectedOptions)
              ? t.selectedOptions
              : []
            ).map((option) => {
              const key = String(option).toLowerCase();
              const unitInfo = unitRefs.find(
                (u) => u.optionName?.toLowerCase() === key,
              );
              const reference = unitInfo?.referance
                ? getReferenceForPatient(
                    unitInfo.referance,
                    ageMonths,
                    patient.gender,
                  )
                : 'N/A';

              return {
                name: String(option),
                selectedOption: String(option),
                result:
                  ((t.selectedOptionResults as Record<string, any>) || {})[
                    String(option)
                  ] || '',
                unit: unitInfo?.unit || '',
                reference,
              };
            }),
          })),
        Doctor: {
          doctorId: c.Doctor.user_Id,
          name: c.Doctor.name,
          specialist: c.Doctor.specialist,
        },
        Hospital: { name: c.Hospital.name },
      };
    });

    return {
      status: 'success',
      message: 'Consultations with completed tests fetched',
      data: formatted,
    };
  }

  async findAllByMedical(hospitalId: number, mode: number) {
    console.log('Mode in service:', mode);
    const extraCondition =
      mode == 0
        ? { medicineTonic: true }
        : mode == 1
          ? { Injection: true, medicineTonic: false }
          : {};
    log('Extra Condition:', extraCondition);
    return this.prisma.consultation.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        ...extraCondition,
        // queueStatus: 'COMPLETED',
        status: { in: ['ENDPROCESSING', 'ONGOING', 'COMPLETED'] },
      },
      include: {
        Hospital: true,
        Patient: true,
        MedicinePatient: {
          include: {
            Medician: true,
            Payment: true,
          },
        },
        InjectionPatient: {
          include: {
            Injection: true,
            Payment: true,
          },
        },

        TonicPatient: {
          include: {
            Tonic: true,
            Payment: true,
          },
        },
        Doctor: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findByHospitalDoctor(hospitalId: number, doctorId: string) {
    return this.prisma.consultation.findMany({
      where: { hospital_Id: Number(hospitalId), doctor_Id: doctorId }, // assuming hospitalId is numeric
      include: {
        Hospital: true,
        Patient: true,
        Doctor: true,
      },
    });
  }
  async findOne(id: number) {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true, Doctor: true },
    });

    if (!consultation)
      throw new NotFoundException(`Consultation with ID ${id} not found`);
    return {
      status: 'success',
      message: 'Consultation fetched',
      data: consultation,
    };
  }

  async update(id: number, data: any) {
    try {
      const consultation = await this.prisma.consultation.updateMany({
        where: { id },
        data,
      });
      return {
        status: 'success',
        message: 'Consultation updated',
        data: consultation,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
  async updateQueueStatus(id: number, queueStatus: QueueStatus) {
    const updated = await this.prisma.consultation.update({
      where: { id },
      data: { queueStatus },
    });

    this.gateway.sendQueueStatusUpdate(updated.id, updated.queueStatus);
    return updated;
  }

  //   async update(id: number, data: any) {
  //   try {
  //     const consultation = await this.prisma.consultation.update({
  //       where: { id },
  //       data: {
  //         treatment: data.treatment ?? undefined,
  //         medicineInjection: data.medicineInjection ?? undefined,
  //         scanningTesting: data.testingScanning ?? undefined,
  //         status: data.status ?? undefined,
  //       },
  //     });
  //     return { status: "success", message: "Consultation updated", data: consultation };
  //   } catch (error) {
  //     return { status: "failed", error: error.message };
  //   }
  // }

  async remove(id: number) {
    try {
      const consultation = await this.prisma.consultation.delete({
        where: { id },
      });
      return {
        status: 'success',
        message: 'Consultation deleted',
        data: consultation,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

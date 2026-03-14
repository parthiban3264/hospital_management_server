import { Injectable, NotFoundException } from '@nestjs/common';
import { log } from 'console';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs from 'dayjs';
import { register } from 'module';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      log('dats', data);
      const payment = await this.prisma.payment.create({
        data: {
          hospital_Id: Number(data.hospital_Id),
          staff_Id: data.staff_Id,
          patient_Id: data.patient_Id,
          reason: data.reason,
          status: data.status ?? 'PENDING',
          amount: data.amount,
          consultation_Id: data.consultation_Id,
          transactionId: data.transactionId,
          billingId: data.billingId,
          type: data.type,
          createdAt: data.createdAt || new Date().toISOString(),
        },
      });
      return { status: 'success', message: 'Payment created', data: payment };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async supplementarybillcreate(data: any) {
    try {
      log('bill Items', data.billItems);
      const result = await this.prisma.$transaction(async (tx) => {
        const existsPayment = await tx.payment.findFirst({
          where: {
            patient_Id: data.patient_Id,
            consultation_Id: data.consultation_Id,
            type: 'SUPPLEMENTARYFEE',
            status: 'PENDING',
          },
        });

        let payment;

        if (!existsPayment) {
          payment = await tx.payment.create({
            data: {
              hospital_Id: Number(data.hospital_Id),
              staff_Id: data.staff_Id,
              patient_Id: data.patient_Id,
              reason: data.reason,
              status: data.status ?? 'PENDING',
              amount: Number(data.amount),
              consultation_Id: data.consultation_Id,
              transactionId: data.transactionId,
              billingId: data.billingId,
              type: 'SUPPLEMENTARYFEE',
              createdAt: data.createdAt ?? new Date().toISOString(),
            },
          });
        } else {
          payment = await tx.payment.update({
            where: {
              id: existsPayment.id,
            },
            data: {
              amount: {
                increment: Number(data.amount),
              },
            },
          });
        }

        const billItems = data.billItems;

        const supplementaryFee = await tx.supplementaryBill.createMany({
          data: billItems.map((item) => ({
            payment_Id: payment.id,
            description: item.description ?? '-',
            amount: Number(item.amount),
            createdAt: data.createdAt ?? new Date(),
          })),
        });

        return { payment, supplementaryFee };
      });
      log('payment', result);
      return {
        status: 'success',
        message: 'Supplementary fee processed successfully',
        data: result,
      };
    } catch (error) {
      log(error);
      return {
        status: 'failed',
        error: error.message,
      };
    }
  }

  async findPendingPaymentsByHospital(hospitalId: number) {
    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: {
          in: ['PENDING', 'PAID', 'CANCELLED'], // Only pending or ongoing payments
        },
        NOT: { type: 'MEDICINETONICINJECTIONFEES' },
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },
        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Sort by creation date
      },
    });
  }
  // async findPendingLimitedPaymentsByHospitalNew(
  //   hospitalId: number,
  //   page: number,
  //   limit: number,
  // ) {
  //   const skip = (page - 1) * limit;
  //   return this.prisma.payment.findMany({
  //     where: {
  //       hospital_Id: Number(hospitalId),
  //       status: {
  //         in: ['PENDING','PAID','CANCELLED'], // Only pending or ongoing payments
  //       },
  //       NOT: {type: 'MEDICINETONICINJECTIONFEES' },
  //     },
  //     include: {
  //       Hospital: {select: {id:true ,name: true,}},
  //       Patient: {select: {id:true,user_Id: true, name:true, dob:true, gender:true,phone:true,address:true,createdAt:true,bldGrp:true},},
  //       Consultation: {select:{ id : true ,doctor_Id:true,patient_Id:true,sugar:true,PK:true, SPO2:true,temperature:true,height:true,weight:true, bp:true, BMI:true, emergency:true,registrationFee:true,sugarTestFee:true,emergencyFee:true,consultationFee:true,status:true,tokenDate:true,tokenNo:true} },
  //       TestingAndScanningPatients: {select: { id: true, title: true, type: true, status: true,payment_Id:true, consultation_Id: true,amount:true,selectedOptions:true,selectedOptionAmounts:true,unSelectedOptions:true },},
  //       MedicinePatient: {select: { id: true, medicine_Id: true, quantity: true,payment_Id:true, consultation_Id: true,total:true },},
  //       TonicPatient: {select: { id: true, tonic_Id: true, quantity: true,payment_Id:true, consultation_Id: true,total:true },},
  //       InjectionPatient: {select: { id: true, injection_Id: true, quantity: true,payment_Id:true, consultation_Id: true,total:true },},
  //     },
  //     orderBy: {
  //       createdAt: 'asc', // Sort by creation date
  //     },
  //     skip,
  //     take: limit,
  //   });
  //}

  async findPendingLimitedPaymentsByHospitalNew(
    hospitalId: number,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    // 📅 Date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    // 🔥 STEP 1: Fetch ordered payment IDs (MySQL syntax)
    const paymentIds: { id: number }[] = await this.prisma.$queryRaw`
    SELECT id
    FROM \`Payment\`
    WHERE
      hospital_Id = ${Number(hospitalId)}
      AND status IN ('PENDING', 'PAID', 'CANCELLED')
      AND type != 'MEDICINETONICINJECTIONFEES'
    ORDER BY
      CASE
        WHEN createdAt >= ${today} THEN 1
        WHEN createdAt >= ${yesterday} THEN 2
        WHEN createdAt >= ${twoDaysAgo} THEN 3
        ELSE 4
      END,
      createdAt ASC
    LIMIT ${limit} OFFSET ${skip};
  `;

    if (!paymentIds.length) return [];

    const ids = paymentIds.map((p) => p.id);

    // 🔥 STEP 2: Fetch full records with Prisma includes
    const payments = await this.prisma.payment.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        Hospital: {
          select: { id: true, name: true },
        },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
            displayToken: true,
            isTestOnly: true,
          },
        },
        Admission: true,
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },

        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
    });

    // 🔥 STEP 3: Maintain custom order
    const orderedPayments = ids.map((id) => payments.find((p) => p.id === id));

    return orderedPayments;
  }

  async findPendingPaymentsByHospitalNew(hospitalId: number) {
    //   const sevenDaysAgo = new Date();
    // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgoStr = dayjs()
      .subtract(3, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const twoDaysAgoStr = dayjs()
      .subtract(2, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const monthDaysAgoStr = dayjs()
      .subtract(1, 'month')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly

    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),

        Consultation: {},
        TestingAndScanningPatients: {
          none: {
            type: 'CT-SCAN',
          },
        },

        type: {
          notIn: ['MEDICINETONICINJECTIONFEES', 'SUPPLEMENTARYFEE'],
        },
        // NOT: {
        //   type: 'MEDICINETONICINJECTIONFEES',
        // },

        OR: [
          // ✅ All PENDING (no date restriction)
          {
            status: 'PENDING',
            createdAt: {
              gte: threeDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PARTIALLY_PAID',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ PAID → only last 7 days
          {
            status: 'PAID',
            updatedAt: {
              gte: twoDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PAYLATER',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ CANCELLED → all (or add date if you want)
          {
            status: 'CANCELLED',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
        ],
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
            isTestOnly: true,
            referredByDoctorName: true,
            displayToken: true,
          },
        },
        Admission: {
          select: {
            id: true,
            status: true,
            patient_Id: true,
            admitTime: true,
            wardChange: true,
            dischargeTime: true,
            bedId: true,
            staffChange: true,
            bed: { include: { ward: true } },
            charges: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },
        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Sort by creation date
      },
    });
  }

  async findCtScanPendingPaymentsByHospitalNew(hospitalId: number) {
    //   const sevenDaysAgo = new Date();
    // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgoStr = dayjs()
      .subtract(3, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const twoDaysAgoStr = dayjs()
      .subtract(2, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const monthDaysAgoStr = dayjs()
      .subtract(1, 'month')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly

    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),

        Consultation: {},
        TestingAndScanningPatients: {
          some: {
            type: 'CT-SCAN',
          },
        },

        NOT: {
          type: 'MEDICINETONICINJECTIONFEES',
        },

        OR: [
          // ✅ All PENDING (no date restriction)
          {
            status: 'PENDING',
            createdAt: {
              gte: threeDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PARTIALLY_PAID',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ PAID → only last 7 days
          {
            status: 'PAID',
            updatedAt: {
              gte: twoDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PAYLATER',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ CANCELLED → all (or add date if you want)
          {
            status: 'CANCELLED',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
        ],
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
            isTestOnly: true,
            displayToken: true,
            referredByDoctorName: true,
          },
        },
        Admission: {
          select: {
            id: true,
            status: true,
            patient_Id: true,
            admitTime: true,
            wardChange: true,
            dischargeTime: true,
            bedId: true,
            staffChange: true,
            bed: { include: { ward: true } },
            charges: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },
        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Sort by creation date
      },
    });
  }

  async findInitialPendingPaymentsByHospitalNew(hospitalId: number) {
    //   const sevenDaysAgo = new Date();
    // sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const threeDaysAgoStr = dayjs()
      .subtract(3, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const twoDaysAgoStr = dayjs()
      .subtract(2, 'day')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly
    const monthDaysAgoStr = dayjs()
      .subtract(1, 'month')
      .format('YYYY-MM-DD hh:mm A'); // match your DB format exactly

    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        type: 'SUPPLEMENTARYFEE',

        Consultation: {},

        OR: [
          // ✅ All PENDING (no date restriction)
          {
            status: 'PENDING',
            createdAt: {
              gte: threeDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PARTIALLY_PAID',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ PAID → only last 7 days
          {
            status: 'PAID',
            updatedAt: {
              gte: twoDaysAgoStr, // ✅ Date object
            },
          },
          {
            status: 'PAYLATER',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
          // ✅ CANCELLED → all (or add date if you want)
          {
            status: 'CANCELLED',
            createdAt: {
              gte: monthDaysAgoStr, // ✅ Date object
            },
          },
        ],
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
            isTestOnly: true,
            displayToken: true,
            referredByDoctorName: true,
          },
        },
        Admission: {
          select: {
            id: true,
            status: true,
            patient_Id: true,
            admitTime: true,
            wardChange: true,
            dischargeTime: true,
            bedId: true,
            staffChange: true,
            bed: { include: { ward: true } },
            charges: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },
        Supplementary: true,
      },
      orderBy: {
        createdAt: 'asc', // Sort by creation date
      },
    });
  }
  async findPendingPaymentsByHospitalNewTest(hospitalId: number) {
    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: {
          in: ['PENDING', 'PAID', 'CANCELLED'], // Only pending or ongoing payments
        },
        Consultation: {
          isTestOnly: true,
          //status: "PENDING",
          //paymentStatus: true,
          // symptoms: true,
          //sugerTestQueue: false,
        },
        NOT: { type: 'MEDICINETONICINJECTIONFEES' },
      },
      include: {
        Hospital: { select: { id: true, name: true } },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
            bldGrp: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            sugar: true,
            PK: true,
            SPO2: true,
            temperature: true,
            height: true,
            weight: true,
            bp: true,
            BMI: true,
            emergency: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            consultationFee: true,
            status: true,
            tokenDate: true,
            tokenNo: true,
            isTestOnly: true,
            referredByDoctorName: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
            selectedOptions: true,
            selectedOptionAmounts: true,
            unSelectedOptions: true,
          },
        },
        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Sort by creation date
      },
    });
  }

  // async findPendingPaidByHospital(hospitalId: number) {
  //   return this.prisma.payment.findMany({
  //     where: {
  //       hospital_Id: Number(hospitalId),
  //       status: {
  //         in: ['PAID'], // Only pending or ongoing payments
  //       },
  //     },
  //     include: {
  //       Hospital: true,
  //       Patient: true,
  //       Consultation: true,
  //     },
  //     orderBy: {
  //       createdAt: 'asc', // Sort by creation date
  //     },
  //   });
  // }

  async findPendingPaidByHospital(hospitalId: number) {
    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: 'PAID',
        type: 'REGISTRATIONFEE',

        Consultation: {
          status: 'PENDING',
          paymentStatus: true,
          symptoms: false,
          sugerTestQueue: false,
        },
      },
      include: {
        Hospital: true,
        Patient: true,
        Consultation: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
  async findPendingPaidByHospitalNew(hospitalId: number) {
    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: 'PAID',
        type: 'REGISTRATIONFEE',

        Consultation: {
          //status: "PENDING",
          paymentStatus: true,
          //symptoms: false,
          //sugerTestQueue: false,
        },
      },
      include: {
        Hospital: true,
        Patient: true,
        Consultation: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  // async findPendingPaidByHospital(hospitalId: number) {
  //   return this.prisma.payment.findMany({
  //     where: {
  //       hospital_Id: Number(hospitalId),
  //       status: {
  //         in: ['PAID'], // Only pending or ongoing payments
  //       },
  //     },
  //     include: {
  //       Hospital: true,
  //       Patient: true,
  //       Consultation: true,
  //     },
  //     orderBy: {
  //       createdAt: 'asc', // Sort by creation date
  //     },
  //   });
  // }

  async findPaidByHospitalAccounts(hospitalId: number) {
    return this.prisma.payment.findMany({
      where: {
        hospital_Id: Number(hospitalId),
        status: 'PAID',
      },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            Admins: {
              select: {
                id: true,
                user_Id: true,
                name: true,
                specialist: true,
                status: true,
              },
            },
          },
        },
        Patient: {
          select: {
            id: true,
            hospital_Id: true,
            user_Id: true,
            name: true,
            dob: true,
            gender: true,
            phone: true,
            address: true,
            createdAt: true,
          },
        },
        Consultation: {
          select: {
            id: true,
            doctor_Id: true,
            patient_Id: true,
            consultationFee: true,
            emergencyFee: true,
            sugarTestFee: true,
            registrationFee: true,
            tokenNo: true,
            tokenDate: true,
          },
        },
        TestingAndScanningPatients: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            payment_Id: true,
            consultation_Id: true,
            amount: true,
          },
        },
        MedicinePatient: {
          select: {
            id: true,
            medicine_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        TonicPatient: {
          select: {
            id: true,
            tonic_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
        InjectionPatient: {
          select: {
            id: true,
            injection_Id: true,
            quantity: true,
            payment_Id: true,
            consultation_Id: true,
            total: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findAll(hospital: number) {
    const payments = await this.prisma.payment.findMany({
      where: { hospital_Id: Number(hospital) },
    });
    return { status: 'success', message: 'Payments fetched', data: payments };
  }

  async findAllOverview(hospital: number) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const payments = await this.prisma.payment.findMany({
      where: { hospital_Id: Number(hospital) },
      select: {
        status: true,
        type: true,
        createdAt: true,
        paymentType: true,
      },
    });

    const result = {
      overall: {
        total: payments.length,
        status: {},
        type: {},
        paymentType: {},
      },
      today: {
        total: 0,
        status: {},
        type: {},
        paymentType: {},
      },
    };

    for (const p of payments) {
      // 🔹 OVERALL STATUS
      result.overall.status[p.status] =
        (result.overall.status[p.status] || 0) + 1;

      // 🔹 OVERALL TYPE
      result.overall.type[p.type] = (result.overall.type[p.type] || 0) + 1;

      // 🔹 OVERALL PAYMENT TYPE
      if (p.status === 'PAID') {
        result.overall.paymentType[p.paymentType] =
          (result.overall.paymentType[p.paymentType] || 0) + 1;
      }

      // 🔹 TODAY CHECK
      const created = new Date(p.createdAt);
      if (created >= todayStart && created <= todayEnd) {
        result.today.total += 1;
        result.today.status[p.status] =
          (result.today.status[p.status] || 0) + 1;

        result.today.type[p.type] = (result.today.type[p.type] || 0) + 1;
        if (p.status === 'PAID') {
          result.today.paymentType[p.paymentType] =
            (result.today.paymentType[p.paymentType] || 0) + 1;
        }
      }
    }

    return {
      status: 'success',
      message: 'Payment overview fetched',
      data: result,
    };
  }

  // Payments Filter Data for Accounts
  async findPaidByHospitalAccountsFilterData(
    hospitalId: number,
    day?: string,
    month?: number,
    year?: number,
  ) {
    const now = new Date();

    // ---- DATE SELECTION ----
    let selectedDate = day ? new Date(day) : now;

    let selectedYear = year ?? selectedDate.getFullYear();
    let selectedMonth =
      month !== undefined ? month - 1 : selectedDate.getMonth(); // JS month fix
    let selectedDay = selectedDate.getDate();

    // ---- DAY RANGE ----
    const todayStart = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      23,
      59,
      59,
      999,
    );

    // ---- MONTH RANGE ---
    const monthStart = new Date(selectedYear, selectedMonth, 1);
    const monthEnd = new Date(
      selectedYear,
      selectedMonth + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // ---- YEAR RANGE ----
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    // ---- FETCH DATA ----
    const [payments, drawings, incExp, consultations, drFee] =
      await Promise.all([
        this.prisma.payment.findMany({
          where: {
            hospital_Id: Number(hospitalId),
            status: 'PAID',
          },
          select: {
            paymentType: true,
            type: true,
            amount: true,
            createdAt: true,
            Consultation: {
              where: { hospital_Id: Number(hospitalId), paymentStatus: true },
              select: {
                consultationFee: true,
                registrationFee: true,
                sugarTestFee: true,
                emergencyFee: true,
                createdAt: true,
                doctor_Id: true,
              },
            },
            TestingAndScanningPatients: {
              select: {
                title: true,
                type: true,
                amount: true,
                createdAt: true,
              },
            },
          },
        }),

        this.prisma.drawer.findMany({
          where: { hospital_Id: Number(hospitalId) },
          select: { amount: true, createdAt: true, type: true },
        }),

        this.prisma.incomeAndExpense.findMany({
          where: { hospital_Id: Number(hospitalId) },
          select: { amount: true, createdAt: true, type: true },
        }),

        this.prisma.consultation.findMany({
          where: { hospital_Id: Number(hospitalId), paymentStatus: true },
          select: {
            consultationFee: true,
            registrationFee: true,
            sugarTestFee: true,
            emergencyFee: true,
            createdAt: true,
            doctor_Id: true,
          },
        }),
        this.prisma.admin.findMany({
          where: { hospital_Id: Number(hospitalId), role: 'DOCTOR' },
          select: {
            id: true,
            user_Id: true,
            name: true,
            doctorAmount: true,
            inPatientAmount: true,
          },
        }),
      ]);

    const result = {
      today: {
        totalAmount: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalDrawingIn: 0,
        totalDrawingOut: 0,
        registerationFee: 0,
        consultationFee: 0,
        sugarTestFee: 0,
        emergencyFee: 0,
        testingAmount: 0,
        ScanningAmount: 0,
        paymentType: {},
        type: {},
        consultationDrFee: {},
      },
      month: {
        totalAmount: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalDrawingIn: 0,
        totalDrawingOut: 0,
        registerationFee: 0,
        consultationFee: 0,
        sugarTestFee: 0,
        emergencyFee: 0,
        testingAmount: 0,
        ScanningAmount: 0,
        paymentType: {},
        type: {},
        consultationDrFee: {},
      },
      year: {
        totalAmount: 0,
        totalIncome: 0,
        totalExpense: 0,
        totalDrawingIn: 0,
        totalDrawingOut: 0,
        registerationFee: 0,
        consultationFee: 0,
        sugarTestFee: 0,
        emergencyFee: 0,
        testingAmount: 0,
        ScanningAmount: 0,
        paymentType: {},
        type: {},
        consultationDrFee: {},
      },
      previousAmount: 0,
    };

    let prevPayments = 0;
    let prevIncome = 0;
    let prevExpense = 0;
    let prevDrawerIn = 0;
    let prevDrawerOut = 0;

    if (consultations.length > 0) {
      for (const c of consultations) {
        const created = new Date(c.createdAt);

        if (created >= todayStart && created <= todayEnd) {
          result.today.registerationFee += c.registrationFee ?? 0;
          result.today.consultationFee += c.consultationFee ?? 0;
          result.today.sugarTestFee += c.sugarTestFee ?? 0;
          result.today.emergencyFee += c.emergencyFee ?? 0;

          // doctor calculation
          const doctor = drFee.find((d) => d.user_Id === c.doctor_Id);

          if (doctor) {
            const name = doctor.name;

            result.today.consultationDrFee[name] =
              (result.today.consultationDrFee[name] || 0) +
              (doctor.doctorAmount ?? 0);
          }
        }

        if (created >= monthStart && created <= monthEnd) {
          result.month.registerationFee += c.registrationFee ?? 0;
          result.month.consultationFee += c.consultationFee ?? 0;
          result.month.sugarTestFee += c.sugarTestFee ?? 0;
          result.month.emergencyFee += c.emergencyFee ?? 0;

          // doctor calculation
          const doctor = drFee.find((d) => d.user_Id === c.doctor_Id);

          if (doctor) {
            const name = doctor.name;

            result.month.consultationDrFee[name] =
              (result.month.consultationDrFee[name] || 0) +
              (doctor.doctorAmount ?? 0);
          }
        }

        if (created >= yearStart && created <= yearEnd) {
          result.year.registerationFee += c.registrationFee ?? 0;
          result.year.consultationFee += c.consultationFee ?? 0;
          result.year.sugarTestFee += c.sugarTestFee ?? 0;
          result.year.emergencyFee += c.emergencyFee ?? 0;

          // doctor calculation
          const doctor = drFee.find((d) => d.user_Id === c.doctor_Id);

          if (doctor) {
            const name = doctor.name;

            result.year.consultationDrFee[name] =
              (result.year.consultationDrFee[name] || 0) +
              (doctor.doctorAmount ?? 0);
          }
        }
      }
    }

    // ---- PAYMENTS ----
    for (const p of payments) {
      const created = new Date(p.createdAt);
      const amount = Number(p.amount);

      if (created >= todayStart && created <= todayEnd) {
        result.today.totalAmount += amount;

        result.today.paymentType[p.paymentType] =
          (result.today.paymentType[p.paymentType] || 0) + amount;

        // result.today.type[p.type] = (result.today.type[p.type] || 0) + amount;

        result.today.type[p.type] = result.today.type[p.type] || {};

        result.today.type[p.type][p.paymentType] =
          (result.today.type[p.type][p.paymentType] || 0) + amount;

        if (p.TestingAndScanningPatients.length > 0) {
          for (const ts of p.TestingAndScanningPatients) {
            if (ts.type.toUpperCase() === 'TESTS') {
              result.today.testingAmount += ts.amount;
            } else {
              result.today.ScanningAmount += ts.amount;
            }
          }
        }
      }

      if (created >= monthStart && created <= monthEnd) {
        result.month.totalAmount += amount;

        result.month.paymentType[p.paymentType] =
          (result.month.paymentType[p.paymentType] || 0) + amount;

        // result.month.type[p.type] = (result.month.type[p.type] || 0) + amount;

           result.month.type[p.type] = result.month.type[p.type] || {};

        result.month.type[p.type][p.paymentType] =
          (result.month.type[p.type][p.paymentType] || 0) + amount;

        if (p.TestingAndScanningPatients.length > 0) {
          for (const ts of p.TestingAndScanningPatients) {
            if (ts.type.toUpperCase() === 'TESTS') {
              result.month.testingAmount += ts.amount;
            } else if (ts.type.toUpperCase() !== 'TESTS') {
              result.month.ScanningAmount += ts.amount;
            }
          }
        }
      }

      if (created >= yearStart && created <= yearEnd) {
        result.year.totalAmount += amount;

        result.year.paymentType[p.paymentType] =
          (result.year.paymentType[p.paymentType] || 0) + amount;

        // result.year.type[p.type] = (result.year.type[p.type] || 0) + amount;

           result.year.type[p.type] = result.year.type[p.type] || {};

        result.year.type[p.type][p.paymentType] =
          (result.year.type[p.type][p.paymentType] || 0) + amount;

        if (p.TestingAndScanningPatients.length > 0) {
          for (const ts of p.TestingAndScanningPatients) {
            if (ts.type.toUpperCase() === 'TESTS') {
              result.year.testingAmount += ts.amount;
            } else if (ts.type.toUpperCase() !== 'TESTS') {
              result.year.ScanningAmount += ts.amount;
            }
          }
        }
      }

      if (created < todayStart) prevPayments += amount;
    }

    // ---- DRAWER ----
    for (const d of drawings) {
      const created = new Date(d.createdAt);
      const amount = Number(d.amount);

      if (created >= todayStart && created <= todayEnd) {
        if (d.type === 'IN') result.today.totalDrawingIn += amount;
        if (d.type === 'OUT') result.today.totalDrawingOut += amount;
      }

      if (created >= monthStart && created <= monthEnd) {
        if (d.type === 'IN') result.month.totalDrawingIn += amount;
        if (d.type === 'OUT') result.month.totalDrawingOut += amount;
      }

      if (created >= yearStart && created <= yearEnd) {
        if (d.type === 'IN') result.year.totalDrawingIn += amount;
        if (d.type === 'OUT') result.year.totalDrawingOut += amount;
      }

      if (created < todayStart) {
        if (d.type === 'IN') prevDrawerIn += amount;
        if (d.type === 'OUT') prevDrawerOut += amount;
      }
    }

    // ---- INCOME / EXPENSE ----
    for (const ie of incExp) {
      const created = new Date(ie.createdAt);
      const amount = Number(ie.amount);

      if (created >= todayStart && created <= todayEnd) {
        if (ie.type === 'INCOME') result.today.totalIncome += amount;
        if (ie.type === 'EXPENSE') result.today.totalExpense += amount;
      }

      if (created >= monthStart && created <= monthEnd) {
        if (ie.type === 'INCOME') result.month.totalIncome += amount;
        if (ie.type === 'EXPENSE') result.month.totalExpense += amount;
      }

      if (created >= yearStart && created <= yearEnd) {
        if (ie.type === 'INCOME') result.year.totalIncome += amount;
        if (ie.type === 'EXPENSE') result.year.totalExpense += amount;
      }

      if (created < todayStart) {
        if (ie.type === 'INCOME') prevIncome += amount;
        if (ie.type === 'EXPENSE') prevExpense += amount;
      }
    }

    // ---- OPENING BALANCE ----
    result.previousAmount =
      prevPayments + prevIncome + prevDrawerIn - prevExpense - prevDrawerOut;

    return {
      status: 'success',
      message: 'Filtered payments fetched',
      data: result,
    };
  }

  async findOnes(hospital: number, id: number) {
    log('hospital and id', hospital, id);
    const payments = await this.prisma.payment.findMany({
      where: { hospital_Id: Number(hospital), id: Number(id) },
    });
    return { status: 'success', message: 'Payments fetched', data: payments };
  }

  async findOne(id: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);
    return { status: 'success', message: 'Payment fetched', data: payment };
  }

  async update(id: number, data: any) {
    try {
      const payment = await this.prisma.payment.update({
        where: { id },
        data,
      });

      // if (payment.hospital_Id !== hospitalId) {
      //   return { status: "failed", message: "Hospital mismatch" };
      // }

      return { status: 'success', message: 'Payment updated', data: payment };
    } catch (error) {
      console.error(error);
      if (error.code === 'P2025') {
        return { status: 'failed', message: 'Payment not found' };
      }
      return { status: 'failed', error: error.message };
    }
  }

  //  async decreaseAmount(id: number, data: any) {
  //   try {
  //     const updatePayment = await this.prisma.payment.update({
  //       where: { id },
  //       data:{
  //         amount: {decrement: data.decrementAmount},
  //       },
  //     });

  //     const updateCharges = await this.prisma.charge.updateMany({
  //       where: { id: Number(data.chargeId) },
  //       data:{
  //         amount: {decrement: data.decrementAmount},
  //       },
  //     });
  //     return { status: 'success', message: 'Payment updated', data: updatePayment };
  //   } catch (error) {
  //     console.error(error);
  //     if (error.code === 'P2025') {
  //       return { status: 'failed', message: 'Payment not found' };
  //     }
  //     return { status: 'failed', error: error.message };
  //   }
  // }

  async decreaseAmount(
    id: number,
    data: { decrementAmount: number; chargeId: number },
  ) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Optional: fetch first to validate amounts
        const payment = await tx.payment.findUnique({
          where: { id },
          select: { amount: true },
        });

        if (!payment) {
          throw new Error('PAYMENT_NOT_FOUND');
        }

        if (payment.amount < data.decrementAmount) {
          throw new Error('INSUFFICIENT_PAYMENT_AMOUNT');
        }

        const updatedPayment = await tx.payment.update({
          where: { id },
          data: {
            amount: { decrement: data.decrementAmount },
          },
        });

        const updatedCharge = await tx.charge.update({
          where: { id: data.chargeId },
          data: {
            amount: { decrement: data.decrementAmount },
          },
        });

        return updatedPayment;
      });

      return {
        status: 'success',
        message: 'Payment updated',
        data: result,
      };
    } catch (error: any) {
      console.error(error);

      if (error.message === 'PAYMENT_NOT_FOUND') {
        return { status: 'failed', message: 'Payment not found' };
      }

      if (error.message === 'INSUFFICIENT_PAYMENT_AMOUNT') {
        return { status: 'failed', message: 'Insufficient payment amount' };
      }

      if (error.code === 'P2025') {
        return { status: 'failed', message: 'Record not found' };
      }

      return { status: 'failed', message: error.message };
    }
  }

  async remove(id: number) {
    try {
      const payment = await this.prisma.payment.delete({ where: { id } });
      return { status: 'success', message: 'Payment deleted', data: payment };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

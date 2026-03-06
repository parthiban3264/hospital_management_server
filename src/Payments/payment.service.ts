import { Injectable, NotFoundException } from '@nestjs/common';
import { log } from 'console';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const payment = await this.prisma.payment.create({
        data: {
          hospital_Id: Number(data.hospital_Id),
          staff_Id: data.staff_Id,
          patient_Id: data.patient_Id,
          reason: data.reason,
          status: data.status,
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

        // Consultation: {
        //   status: "PENDING",
        //   paymentStatus: true,
        //   symptoms: false,
        // },
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

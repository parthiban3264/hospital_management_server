import { Injectable, NotFoundException } from '@nestjs/common';
import { scan } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TestingAndScanningPatientService {
  constructor(private prisma: PrismaService) {}

  // async create(data: any) {
  //   const [test, payment] = await this.prisma.$transaction([
  //     this.prisma.testingAndScanningPatient.create({
  //       data: {
  //         hospital_Id: data.hospital_Id,
  //         patient_Id: data.patient_Id,
  //         doctor_Id: data.doctor_Id,
  //         staff_Id: data.staff_Id,
  //         title: data.title,
  //         scheduleDate: new Date(data.scheduleDate),
  //         type: data.type,
  //         selectedOptions: data.selectedOptions,
  //         status: data.status,
  //         paymentStatus: data.paymentStatus,
  //         result: data.result,
  //         createdAt: data.createdAt,
  //       },
  //     }),
  //     this.prisma.payment.create({
  //       data: {
  //         hospital_Id: data.hospital_Id,
  //         patient_Id: data.patient_Id,
  //         reason: 'Testing & Scanning Fee',
  //         status: 'PENDING',
  //         amount: data.amount,
  //         type: 'TESTINGFEESANDSCANNINGFEE',
  //         createdAt: data.createdAt,
  //       },
  //     }),
  //   ]);

  //   return { test, payment };
  // }
  async create(data: any) {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Find an existing PENDING payment for the same patient in the same hospital
      let payment = await tx.payment.findFirst({
        where: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          type: 'TESTINGFEESANDSCANNINGFEE', // match your logic
          status: 'PENDING',
        },
      });

      // Step 2: Create or update payment
      if (payment) {
        payment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            amount: (payment.amount ?? 0) + (data.amount ?? 0),
            updatedAt: data.createdAt,
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            hospital_Id: data.hospital_Id,
            patient_Id: data.patient_Id,
            reason: 'Testing & Scanning Fee',
            status: 'PENDING',
            consultation_Id: data.consultation_Id,
            amount: data.amount,
            type: 'TESTINGFEESANDSCANNINGFEE',
            createdAt: data.createdAt,
          },
        });
      }

      // Step 3: Create new test linked to that payment
      const test = await tx.testingAndScanningPatient.create({
        data: {
          hospital_Id: data.hospital_Id,
          patient_Id: data.patient_Id,
          doctor_Id: data.doctor_Id,
          staff_Id: data.staff_Id,
          consultation_Id: data.consultation_Id,
          title: data.title,
          scheduleDate: new Date(data.scheduleDate),
          type: data.type,
          selectedOptions: data.selectedOptions,
          selectedOptionResults: data.selectedOptionResults,
          selectedOptionAmounts: data.selectedOptionAmounts,
          status: data.status,
          amount: data.amount,
          reason: data.reason,
          paymentStatus: data.paymentStatus,
          scanImages: data.scanImages,
          result: data.result,
          createdAt: data.createdAt,
          payment_Id: payment.id, // link to the same payment
        },
      });

      return { test, payment };
    });
  }
  async updateTestingAndScanningByPayment(paymentId: number) {
    const result = await this.prisma.testingAndScanningPatient.updateMany({
      where: { payment_Id: Number(paymentId) },
      data: { paymentStatus: true },
    });

    // Return simple success + how many records were updated
    return {
      success: true,
      message: `Updated ${result.count} testing & scanning records successfully.`,
    };
  }
  //await prisma.testingAndScanningPatient.updateMany({
  //   where: { payment_Id: paymentId },
  //   data: { paymentStatus: true },
  // });

  async findAll() {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      include: { Hospital: true, Patient: true },
    });
    return { status: 'success', message: 'Records fetched', data: records };
  }
  // async findAllTestandScanByType(hospital_Id: number, type: string) {
  //   const records = await this.prisma.testingAndScanningPatient.findMany({
  //     where: {
  //       hospital_Id: Number(hospital_Id),
  //       type: type.toUpperCase(),
  //       status: {
  //         in: ['PENDING'],
  //       },
  //       paymentStatus: true,
  //     },
  //     include: { Hospital: {
  //       select: {Admins: {select: {id: true,user_Id:true, name: true}},id:true, name: true,address: true,ScanAndTests: true},
  //   },
  //   Patient: {
  //     include:{Consultation:true}
  //   },
  //   },
  //   });
  //   return { status: 'success', message: 'Records fetched', data: records };
  // }

  // ✅ Get all pending & paid test/scan patients with detailed test info
  async findAllTestAndScanByType(hospital_Id: number, type: string) {
    // Step 1️⃣: Fetch main test/scan records
    const records = await this.prisma.testingAndScanningPatient.findMany({
      where: {
        hospital_Id: Number(hospital_Id),
        type: type.toUpperCase(),
        status: { in: ['PENDING'] },
        paymentStatus: true,
      },
      include: {
        Hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            ScanAndTest: {
              select: {
                id: true,
                title: true,
                options: true,
                type: true,
              },
            },
            Admins: { select: { user_Id: true, name: true } },
          },
        },
        Patient: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            dob: true,
            bldGrp: true,
            gender: true,
            phone: true,
            address: true,
            Consultation: { select: { id: true, doctor_Id: true,tokenNo:true,tokenDate:true, } },
          },
        },
      },
    });

    if (!records.length) {
      return { status: 'success', message: 'No records found', data: [] };
    }

    // Step 2️⃣: Fetch unit/reference info
    const unitRefs = await this.prisma.scanAndTestUnitReference.findMany({
      select: { optionName: true, unit: true, reference: true },
    });

    // Step 3️⃣: Collect doctor user IDs and fetch names
    const doctorUserIds: string[] = Array.from(
      new Set(
        records
          .flatMap((r) =>
            Array.isArray(r.Patient?.Consultation)
              ? r.Patient.Consultation.map((c) => c.doctor_Id) // doctor_Id might be number
              : [],
          )
          .filter(Boolean),
      ),
    ).map((id) => id.toString()); // ✅ convert numbers to strings

    const doctors = await this.prisma.admin.findMany({
      where: { user_Id: { in: doctorUserIds } }, // now matches string[]
      select: { user_Id: true, name: true },
    });

    const doctorMap = new Map<number, string>();
    doctors.forEach((d) => doctorMap.set(Number(d.user_Id), d.name));

    // Helper: Calculate age
    const calculateAge = (dob: Date | string | null) => {
      if (!dob) return { years: 0, months: 0 };
      const birth = new Date(dob);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth() + years * 12;
      if (now.getDate() < birth.getDate()) months -= 1;
      years = Math.floor(months / 12);
      return { years, months };
    };

    // Helper: Get correct reference
    const getCorrectReference = (
      refJson: any,
      age: { years: number; months: number },
      gender: string,
    ): string => {
      if (!refJson) return 'N/A';
      let parsed;
      try {
        parsed = typeof refJson === 'string' ? JSON.parse(refJson) : refJson;
      } catch {
        return 'N/A';
      }

      const normalized: any = {};
      Object.keys(parsed).forEach(
        (k) => (normalized[k.toLowerCase()] = parsed[k]),
      );
      const genderKey = gender?.toLowerCase().startsWith('f') ? 'f' : 'm';
      const totalMonths = age.months;

      for (const key of Object.keys(normalized)) {
        const parts = key.split('_');
        if (parts.length < 3) continue;
        const min = parseInt(parts[0], 10);
        const max = parseInt(parts[1], 10);
        const genderPart = parts[2].toLowerCase();
        if (!genderPart.includes(genderKey)) continue;
        if (totalMonths >= min && totalMonths <= max)
          return normalized[key] ?? 'N/A';
      }
      return 'N/A';
    };

    // Step 4️⃣: Merge test, patient, hospital, references, selectedOption, doctor info
    const result = records.map((rec) => {
      const hospital = rec.Hospital ?? {
        name: '',
        address: '',
        ScanAndTests: [],
      };
      const patient = rec.Patient ?? {
        id: 0,
        name: '',
        user_Id: '',
        gender: '',
        dob: '',
        bldGrp: 'N/A',
        address: {},
        phone: {},
        Consultation: [],
      };
      //const hospitalTests = hospital.ScanAndTest ?? [];
      const hospitalTests = Array.isArray((hospital as any).ScanAndTest)
        ? (hospital as any).ScanAndTest
        : [];

      const age = calculateAge(patient.dob);
      const gender = patient.gender ?? '';

      // Parse selectedOptions
      let selectedOptions: any = {};
      if (rec.selectedOptions) {
        if (typeof rec.selectedOptions === 'string') {
          try {
            selectedOptions = JSON.parse(rec.selectedOptions);
          } catch {
            selectedOptions = {};
          }
        } else if (Array.isArray(rec.selectedOptions)) {
          selectedOptions = rec.selectedOptions.reduce(
            (acc: any, val: string) => {
              acc[val] = val;
              return acc;
            },
            {},
          );
        } else if (typeof rec.selectedOptions === 'object') {
          selectedOptions = rec.selectedOptions;
        }
      }

      // Parse selectedOptionResults
      const selectedOptionResults =
        rec.selectedOptionResults &&
        typeof rec.selectedOptionResults === 'string'
          ? JSON.parse(rec.selectedOptionResults)
          : (rec.selectedOptionResults ?? {});

      // Match tests by title
      const relatedTests = hospitalTests.filter(
        (t) => t.title?.toUpperCase() === (rec.title ?? '').toUpperCase(),
      );

      // const detailedTests = relatedTests.map((test) => {
      //   const testOptions = Array.isArray(test.options)
      //     ? test.options
      //     : JSON.parse(test.options ?? '[]');

      //   const mergedOptions = testOptions.map((opt: any) => {
      //     const unitInfo = unitRefs.find(
      //       (u) =>
      //         u.optionName?.trim().toLowerCase() ===
      //         opt.name?.trim().toLowerCase(),
      //     );
      //     const reference = unitInfo?.reference
      //       ? getCorrectReference(unitInfo.reference, age, gender)
      //       : 'N/A';

      //     return {
      //       name: opt.name,
      //       price: opt.price ?? null,
      //       unit: unitInfo?.unit ?? 'N/A',
      //       reference,
      //       selectedOption: selectedOptions[opt.name] ?? 'N/A',
      //       result: selectedOptionResults[opt.name] ?? 'N/A',
      //     };
      //   });

      //   return {
      //     id: test.id,
      //     title: test.title,
      //     results: rec.result,
      //     type: test.type,
      //     scanImages: rec.scanImages ?? null,
      //     options: mergedOptions,
      //   };
      // });

      const detailedTests = relatedTests.map((test) => {
        const testOptions = test.options ?? [];

        const mergedOptions = testOptions.map((opt: any) => {
          const unitInfo = unitRefs.find(
            (u) =>
              u.optionName?.trim().toLowerCase() ===
              opt.optionName?.trim().toLowerCase(),
          );

          const reference = unitInfo?.reference
            ? getCorrectReference(unitInfo.reference, age, gender)
            : 'N/A';

          return {
            name: opt.optionName,
            price: opt.price ?? null,
            unit: unitInfo?.unit ?? 'N/A',
            reference,
            selectedOption: selectedOptions[opt.optionName] ?? 'N/A',
            result: selectedOptionResults[opt.optionName] ?? 'N/A',
          };
        });

        return {
          id: test.id,
          title: test.title,
          results: rec.result,
          type: test.type,
          scanImages: rec.scanImages ?? null,
          options: mergedOptions,
        };
      });

      // Doctor info
      let doctorInfo = { id: 'N/A', name: 'N/A', consultationId: 'N/A' };
      if (
        Array.isArray(patient.Consultation) &&
        patient.Consultation.length > 0
      ) {
        const consultation = patient.Consultation[0];
        const docUserId = Number(consultation?.doctor_Id);
        if (docUserId)
          doctorInfo = {
            id: String(docUserId),
            name: doctorMap.get(docUserId) ?? 'N/A',
            consultationId: String(consultation.id),
          };
      }

      return {
        id: rec.id,
        consulateId: rec.consultation_Id,
        patient_Id: rec.patient_Id,
        staff_Id: rec.staff_Id,
        title: rec.title,
        type: rec.type,
        status: rec.status,
        queueStatus: rec.queueStatus ?? 'N/A',
        scheduleDate: rec.scheduleDate,
        result: rec.result,
        reason: rec.reason,
        createdAt: rec.createdAt,
        Patient: {
          id: patient.id,
          name: patient.name ?? 'N/A',
          gender,
          bldGrp: (patient as any).bldGrp ?? 'N/A',
          user_Id: patient.user_Id ?? 'N/A',
          age: age.years,
          dob: patient.dob ?? '',
          address: patient.address ?? {},
          phone:
            typeof patient.phone === 'object' && patient.phone
              ? ((patient.phone as any).mobile ?? '-')
              : '-',
          doctor: doctorInfo,
          tokenNo: patient.Consultation && patient.Consultation.length > 0
            ? patient.Consultation[0].tokenNo ?? '-': '-',
        },
        Hospital: {
          name: hospital.name ?? 'N/A',
          address: hospital.address ?? 'N/A',
        },
        testDetails: detailedTests,
      };
    });

    return {
      status: 'success',
      message: 'Records fetched successfully',
      count: result.length,
      data: result,
    };
  }

  async finfindAllTestandScan(hospital_Id: number) {
    const records = await this.prisma.testingAndScanningPatient.findMany({
      where: {
        hospital_Id: Number(hospital_Id),
      },
      include: {
        Hospital: true,
        Patient: {
          include: { Consultation: true },
        },
      },
    });
    return { status: 'success', message: 'Records fetched', data: records };
  }

  async findOne(id: number) {
    const record = await this.prisma.testingAndScanningPatient.findUnique({
      where: { id },
      include: { Hospital: true, Patient: true },
    });
    if (!record) throw new NotFoundException(`Record with ID ${id} not found`);
    return { status: 'success', message: 'Record fetched', data: record };
  }

  async updateTeating(id: number, data: any) {
    const updatedRecord = await this.prisma.testingAndScanningPatient.update({
      where: { id },
      data,
    });

    return {
      status: 'success',
      message: 'Record updated successfully',
      data: updatedRecord,
    };
  }

  async update(id: number, data: any) {
    try {
      console.log('🔥RAW DATA:', data);

      // ---- Parse selectedOptionResults JSON ----
      if (data.selectedOptionResults) {
        if (typeof data.selectedOptionResults === 'string') {
          try {
            data.selectedOptionResults = JSON.parse(data.selectedOptionResults);
          } catch (e) {
            console.log('❌ selectedOptionResults parse failed');
          }
        }
      }

      // ---- Parse images JSON (if string) ----
      if (data.images) {
        if (typeof data.images === 'string') {
          try {
            data.images = JSON.parse(data.images);
          } catch (e) {
            console.log('❌ images parse failed');
          }
        }
      }

      console.log('🟢 Parsed DATA:', data);

      const updatedRecord = await this.prisma.testingAndScanningPatient.update({
        where: { id },
        data: {
          result: data.result,
          status: data.status,
          updatedAt: data.updatedAt,
          staff_Id: data.staff_Id,

          // Save JSON fields safely
          selectedOptionResults: data.selectedOptionResults ?? undefined,
          scanImages: data.images ?? undefined,
        },
      });

      return {
        status: 'success',
        message: 'Record updated successfully',
        data: updatedRecord,
      };
    } catch (error) {
      console.log('❌ SERVER ERROR:', error);
      return {
        status: 'failed',
        error: error.message,
      };
    }
  }

  async remove(id: number) {
    try {
      const record = await this.prisma.testingAndScanningPatient.delete({
        where: { id },
      });
      return { status: 'success', message: 'Record deleted', data: record };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

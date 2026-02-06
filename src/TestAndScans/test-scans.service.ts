import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Types } from '@prisma/client';
import { log } from 'console';

@Injectable()
export class TestAndScanService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE MULTIPLE TESTS
//   async create(data: Prisma.ScanAndTestCreateManyInput[]) {
//     try {
//       const result = await this.prisma.scanAndTests.createMany({
//         data: data.map((item) => ({
//           hospital_Id: item.hospital_Id,
//           title: item.title,
//           type: item.type,
//           options: item.options,
//           amount: item.amount ?? null,
//           createdAt: item.createdAt,
//           updatedAt: item.updatedAt,
//         })),
//       });

//       return {
//         status: 'success',
//         message: `${result.count} records created successfully`,
//       };
//     } catch (error) {
//       return { status: 'failed', error: error.message };
//     }
//   }

// async create(data: any[]) {
//   try {
//     console.log('Create body received:', JSON.stringify(data, null, 2));

//     const results = await this.prisma.$transaction(
//       data.map((item) =>
//         this.prisma.scanAndTests.create({
//           data: {
//             hospital_Id: item.hospital_Id,
//             title: item.title,
//             type: item.type,
//             amount: item.amount ?? null,
//             createdAt: item.createdAt ?? null,
//             updatedAt: item.updatedAt ?? null,
//             options: {
//               create: item.options.map((opt) => {
//                 const optionName = opt.optionName ?? opt.name;

//                 if (!optionName) {
//                   throw new Error('optionName is required');
//                 }

//                 return {
//                   price: opt.price ?? null,
//                   unitRef: {
//                     connect: { optionName },
//                   },
//                 };
//               }),
//             },
//           },
//         }),
//       ),
//     );

//     return {
//       status: 'success',
//       message: `${results.length} records created successfully`,
//     };
//   } catch (error) {
//     console.error(error);
//     return {
//       status: 'failed',
//       error: error.message,
//     };
//   }
// }

async create(data: any[]) {
  try {
    console.log('Create body received:', JSON.stringify(data, null, 2));

    for (const item of data) {
      // 1️⃣ Find existing Scan/Test
      let scanTest = await this.prisma.scanAndTests.findFirst({
        where: {
          hospital_Id: item.hospital_Id,
          title: item.title,
          type: item.type,
        },
      });

      // 2️⃣ Create Scan/Test ONLY if not exists
      if (!scanTest) {
        scanTest = await this.prisma.scanAndTests.create({
          data: {
            hospital_Id: item.hospital_Id,
            title: item.title,
            type: item.type,
            amount: item.amount ?? null,
            createdAt: item.createdAt ?? null,
            updatedAt: item.updatedAt ?? null,
          },
        });
      }

      // 3️⃣ Add options (NO duplicates)
      for (const opt of item.options) {
        const optionName = opt.optionName ?? opt.name;
        if (!optionName) continue;

        // check duplicate option
        const optionExists = await this.prisma.scanAndTestOption.findFirst({
          where: {
            scanTestId: scanTest.id,
            optionName: optionName,
          },
        });

        if (optionExists) continue;

       await this.prisma.scanAndTestOption.create({
  data: {
    price: opt.price ?? null,
    scanTest: {
      connect: { id: scanTest.id },
    },
    unitRef: {
      connect: { optionName },
    },
  },
});

      }
    }

    return {
      status: 'success',
      message: 'Scan/Test processed successfully',
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}



  // ✅ GET ALL TESTS BY HOSPITAL + TYPE
  async findAll(hospital_Id: number, type: Types) {
    return this.prisma.scanAndTestsWithPerHospital.findMany({
      where: { hospital_Id,type,isActive:true },
      include: { options: true },
    });
  }

  // ✅ GET ONE TEST
  async findOne(id: number) {
    return this.prisma.scanAndTests.findUnique({ where: { id } });
  }

  // ✅ UPDATE TEST
//   async update(id: number, data: any) {
//     return this.prisma.scanAndTests.update({
//       where: { id },
//       data,
//     });
//   }

async update(id: number, data: any) {
  const { options, createdAt, updatedAt, ...rest } = data;

  return this.prisma.scanAndTests.update({
    where: { id },
    data: {
      ...rest,
      updatedAt: new Date().toDateString(),

      options: {
        deleteMany: {},
        create: options.map((o) => ({
          optionName: o.name,   // 🔥 MUST MATCH unitRef.optionName
          price: Number(o.price),
        })),
      },
    },
  });
}



  // ✅ DELETE TEST
  async remove(id: number) {
    return this.prisma.scanAndTest.delete({ where: { id } });
  }

  // ✅ CREATE / UPDATE UNIT + REFERENCE
  // async upsertUnitReference(optionName: string, unit: string, reference: any) {
  //   try {
  //     const result = await this.prisma.scanAndTestUnitReferance.upsert({
  //       where: { optionName },
  //       update: { unit, reference: reference, updatedAt: new Date().toISOString() },
  //       create: {
  //         optionName,
  //         unit,
  //         reference: reference,
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //       },
  //     });

  //     return {
  //       status: 'success',
  //       data: result,
  //     };
  //   } catch (error) {
  //     return { status: 'failed', error: error.message };
  //   }
  // }

  async upsertManyUnitReferences(data: { optionName: string; unit: string; referance: any }[]) {
  try {
    const now = new Date().toISOString();

    const results = await this.prisma.$transaction(
      data.map((item) =>
        this.prisma.scanAndTestUnitReference.upsert({
          where: { optionName: item.optionName },
          update: {
            unit: item.unit,
            reference: item.referance,
            updatedAt: now,
          },
          create: {
            optionName: item.optionName,
            unit: item.unit,
            reference: item.referance,
            optionTitle: '',
            createdAt: now,
            updatedAt: now,
          },
        }),
      ),
    );

    return {
      status: 'success',
      message: `${results.length} records upserted successfully`,
      data: results,
    };
  } catch (error) {
    console.error('UpsertMany Error:', error);
    return {
      status: 'failed',
      error: error.message,
    };
  }
}


  // ✅ GET ALL UNIT REFERENCES
  async getAllUnitReferences() {
    return this.prisma.scanAndTestUnitReference.findMany();
  }

  // ✅ GET ALL UNIT REFERENCES
  async getAllUnitReference( type: string) {
    return this.prisma.scanAndTestUnitReference.findMany({
      where: { type },
    });
  }
  // ✅ GET SINGLE UNIT REFERENCE
  async getUnitReference(optionName: string) {
    return this.prisma.scanAndTestUnitReference.findUnique({
      where: { optionName },
    });
  }

  // ✅ DELETE UNIT REFERENCE
  async deleteUnitReference(optionName: string) {
    return this.prisma.scanAndTestUnitReference.delete({
      where: { optionName },
    });
  }

  // ✅ MERGE TEST + UNIT/REFERENCE INFO
  async getTestWithUnitReference(id: number) {
    const test = await this.prisma.scanAndTest.findUnique({
      where: { id },
    });

    if (!test) {
      throw new Error(`Test with ID ${id} not found`);
    }

    const unitRefs = await this.prisma.scanAndTestUnitReference.findMany();

    const options = (test.options as any[]).map((opt) => ({
      ...opt,
      unitInfo: unitRefs.find((u) => u.optionName === opt.name) || null,
    }));

    return { ...test, options };
  }
}
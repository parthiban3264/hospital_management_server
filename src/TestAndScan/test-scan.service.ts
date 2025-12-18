// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { Prisma, Types } from '@prisma/client';

// @Injectable()
// export class TestAndScanService {
//   constructor(private prisma: PrismaService) {}

//   // CREATE
//   async create(data: Prisma.ScanAndTestCreateManyInput[]) {
//     try {
//       const result = await this.prisma.scanAndTest.createMany({
//         data: data.map((item) => ({
//           hospital_Id: item.hospital_Id,
//           title: item.title,
//           type: item.type,
//           options: item.options,
//           crearedAt: item.crearedAt,
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

//   // FIND ALL
//   findAll(hospital_Id: number, type :Types) {
//     return this.prisma.scanAndTest.findMany({
//       where: {
//         hospital_Id,
//         type,
//       },
//     });
//   }

//   // FIND ONE
//   findOne(id: number) {
//     return this.prisma.scanAndTest.findUnique({
//       where: { id },
//     });
//   }

//   // UPDATE
//   update(id: number, data: Prisma.ScanAndTestUpdateInput) {
//     return this.prisma.scanAndTest.update({
//       where: { id },
//       data,
//     });
//   }

//   // DELETE
//   remove(id: number) {
//     return this.prisma.scanAndTest.delete({
//       where: { id },
//     });
//   }
// }

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Types } from '@prisma/client';

@Injectable()
export class TestAndScanService {
  constructor(private prisma: PrismaService) {}

  // ✅ CREATE MULTIPLE TESTS
  async create(data: Prisma.ScanAndTestCreateManyInput[]) {
    try {
      const result = await this.prisma.scanAndTest.createMany({
        data: data.map((item) => ({
          hospital_Id: item.hospital_Id,
          title: item.title,
          type: item.type,
          options: item.options,
          amount: item.amount ?? null,
          crearedAt: item.createdAt ?? new Date().toISOString(),
          updatedAt: item.updatedAt ?? new Date().toISOString(),
        })),
      });

      return {
        status: 'success',
        message: `${result.count} records created successfully`,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  // ✅ GET ALL TESTS BY HOSPITAL + TYPE
  async findAll(hospital_Id: number, type: Types) {
    return this.prisma.scanAndTest.findMany({
      where: { type },
    });
  }

  // ✅ GET ONE TEST
  async findOne(id: number) {
    return this.prisma.scanAndTest.findUnique({ where: { id } });
  }

  // ✅ UPDATE TEST
  async update(id: number, data: Prisma.ScanAndTestUpdateInput) {
    return this.prisma.scanAndTest.update({
      where: { id },
      data,
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
        this.prisma.scanAndTestUnitReferance.upsert({
          where: { optionName: item.optionName },
          update: {
            unit: item.unit,
            referance: item.referance,
            updatedAt: now,
          },
          create: {
            optionName: item.optionName,
            unit: item.unit,
            referance: item.referance,
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
    return this.prisma.scanAndTestUnitReferance.findMany();
  }

  // ✅ GET SINGLE UNIT REFERENCE
  async getUnitReference(optionName: string) {
    return this.prisma.scanAndTestUnitReferance.findUnique({
      where: { optionName },
    });
  }

  // ✅ DELETE UNIT REFERENCE
  async deleteUnitReference(optionName: string) {
    return this.prisma.scanAndTestUnitReferance.delete({
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

    const unitRefs = await this.prisma.scanAndTestUnitReferance.findMany();

    const options = (test.options as any[]).map((opt) => ({
      ...opt,
      unitInfo: unitRefs.find((u) => u.optionName === opt.name) || null,
    }));

    return { ...test, options };
  }
}

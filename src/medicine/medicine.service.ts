import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMedicineDto } from './dto/create-medicine.dto';
import { UpdateMedicineDto } from './dto/update-medicine.dto';

const prisma = new PrismaClient();

@Injectable()
export class MedicineService {



  async getAllMedicinesWithBatches(shop_id: number) {
  return prisma.medicine.findMany({
    where: {
      hospital_Id: shop_id,
      is_active: true, // medicine must be active
      stock: {
        not: 0, // stock must not be zero
      },
    },
    include: {
      batches: {
        where: {
          is_active: true, // batch must be active
          total_stock: {
            not: 0, // batch stock must not be zero
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

async getMedicine(shop_id: number, id: number) {
  return prisma.medicine.findFirst({
    where: {
      id,         
      hospital_Id: shop_id,     
    },
  });
}
//  async finfindAllByhospitaldAll(hospitalId: number) {
//     const injections = await prisma.medicine.findMany({
//       where: { hospital_Id: Number(hospitalId) ,batches:{every:{expiry_date:{gt:new Date()}}}},
//       include:{
//         batches:true,
//       }
//       // include: { Hospital: true, MedicineAndInjection: true },
//     });
//     return { status: "success", message: "Injections fetched", data: injections };
//   }

async finfindAllByhospitaldAll(hospitalId: number) {
  const injections = await prisma.medicine.findMany({
    where: {
      hospital_Id: Number(hospitalId),
      batches: {
        some: {
          expiry_date: {
            gt: new Date(),
          },
        },
      },
      is_active:true,
    },
    select: {
      id: true,
      name: true,
      category: true,
      batches: {
        where: {
          expiry_date: {
            gt: new Date(),
          },
          is_active:true,
        },
      },
    },
  });

  return {
    status: "success",
    message: "Medicines fetched",
    data: injections,
  };
}


async searchMedicines(shopId: number, query: string) {
  if (!query) return [];

  const today = new Date();

  const medicines = await prisma.medicine.findMany({
    where: {
      hospital_Id: shopId,
      is_active: true,
      name: {
        startsWith: query, // ✅ Only matches medicines starting with query
      },
      batches: {
        some: {
          is_active: true,
          expiry_date: { gt: today },
          total_stock: { gt: 0 },
        },
      },
    },
    select: {
      id: true,
      name: true,
      batches: {
        where: {
          is_active: true,
          expiry_date: { gt: today },
          total_stock: { gt: 0 },
        },
        orderBy: {
          expiry_date: 'asc',
        },
        select: {
          id: true,
          batch_no: true,
          rack_no: true,
          total_stock: true,
          unit: true,
          selling_price_unit: true,
          expiry_date: true,
        },
      },
    },
    take: 10, // Limit to 10 results
  });

  // Map the result to your desired output format
  return medicines.map(med => ({
    id: med.id,
    name: med.name,
    batches: med.batches.map(b => ({
      id: b.id,
      batch_no: b.batch_no,
      rack_no: b.rack_no,
      available_qty: b.total_stock,
      selling_price: b.selling_price_unit,
      unit: b.unit,
      expiry_date: b.expiry_date,
    })),
  }));
}

async getLowStockMedicines(shopId: number) {
  const medicines = await prisma.medicine.findMany({
    where: {
      hospital_Id: shopId,
      is_active: true,
      reorder: {
        not: null,
      },
      // 🔴 low stock condition
      stock: {
        lte: prisma.medicine.fields.reorder,
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
      reorder: true,
      ndc_code: true,
      stock: true,
    },
    orderBy: {
      stock: 'asc', // optional: lowest stock first
    },
  });

  // 🔁 rename stock → total_stock for frontend consistency
  return medicines.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    reorder: m.reorder,
    ndc_code: m.ndc_code,
    total_stock: m.stock ?? 0,
  }));
}

  findAll(shop_id: number) {
    return prisma.medicine.findMany({
      where: { hospital_Id:shop_id, is_active: true },
      orderBy: { created_at: 'desc' },
    });
  }


  update(id: number, dto: UpdateMedicineDto) {
    return prisma.medicine.update({
where: {
  hospital_Id_id: {
    hospital_Id: dto.shop_id,
    id: id,
  },
}    ,
  data: dto,
    });
  }

}

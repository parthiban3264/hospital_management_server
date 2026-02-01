import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateMedicineWithBatchDto } from './dto/create-medicine-with-batch.dto';
import { StockMovementType } from '@prisma/client';
import {
  PrismaClient,
  MedicineBatch,
  StockMovement,
} from '@prisma/client';
import { UpdateInventoryStatusDto } from './dto/update-inventory-status.dto';
import { CreateBatchWithStockDto } from './dto/create-batch-with-stock.dto';
import { CreateExistingMedicineDto } from './dto/exist-medicine.dto';
import { CreateExistingBatchDto } from './dto/CreateExistingBatchDto.dto';
import { log } from 'console';

const prisma = new PrismaClient();

@Injectable()
export class InventoryService {

  async createBatchForExistingMedicine(
  medicine_id: number,
  dto: CreateExistingBatchDto,
) {
  // ✅ validations
  if (!dto.mfg_date || !dto.exp_date) {
    throw new BadRequestException('MFG and EXP dates are required');
  }

  if (!dto.unit || dto.unit <= 0) {
    throw new BadRequestException('Unit must be greater than 0');
  }

  if (dto.total_stock === undefined || dto.total_stock < 0) {
    throw new BadRequestException('Total stock must be 0 or more');
  }

  return prisma.$transaction(async (tx) => {
    // 1️⃣ Create Batch
  const batch = await tx.medicineBatch.create({
  data: {
    batch_no: dto.batch_no,
    manufacture_date: new Date(dto.mfg_date),
    expiry_date: new Date(dto.exp_date),

    rack_no: dto.rack_no ?? null,

    unit: dto.unit,
    total_quantity: dto.total_quantity,
    quantity: dto.total_quantity,
    total_stock: dto.total_stock,

    selling_price_unit: dto.selling_price_per_unit,
    selling_price_quantity: dto.selling_price_per_quantity,

    is_active: true,

    hospital: {
      connect: { id: Number(dto.hospital_id) },
    },

    medicine: {
      connect: {
        hospital_Id_id: {
          hospital_Id: Number(dto.hospital_id),
          id: medicine_id,
        },
      },
    },
  },
});


    // 2️⃣ Stock IN
    const stock = await tx.stockMovement.create({
      data: {
        hospital_Id: dto.hospital_id,
        batch_id: batch.id,
        movement_type: StockMovementType.IN,
        quantity: dto.total_stock,
        reason: dto.reason ?? 'Existing Batch Added',
      },
    });

    // 3️⃣ Update Medicine Stock
    await tx.medicine.update({
      where: {
        hospital_Id_id: {
          hospital_Id: dto.hospital_id,
          id: medicine_id,
        },
      },
      data: {
        stock: { increment: dto.total_stock },
      },
    });

    return { batch, stock };
  });
}

    async getExtraCategories(shop_id: number) {
      log('Fetching extra categories for shop:', shop_id);
  const defaultCategories = [
    'Tablets',
    'Syrups',
    'Drops',
    'Ointments',
    'Creams',
    'Soap',
    'Other',
  ];

  const result = await prisma.medicine.findMany({
    where: {
      hospital_Id: Number(shop_id),
      is_active: true,
      category: {
        notIn: defaultCategories,
      },
    },
    select: {
      category: true,
    },
    distinct: ['category'], // ✅ IMPORTANT
  });

  // Return as string array
  return result.map((r) => r.category);
}

  async createBulkMedicineWithBatchAndStock(
  shopId: number,
  batches: any[],
) {
  return prisma.$transaction(async (tx) => {

    const results: {
      medicine_id: number;
      batch_id: number;
    }[] = [];

    for (const body of batches) {

      const lastMedicine = await tx.medicine.findFirst({
  where: { hospital_Id: shopId },
  orderBy: { id: 'desc' },
});

const medicineId = lastMedicine ? lastMedicine.id + 1 : 1;
      // 1️⃣ CREATE MEDICINE
      const medicine = await tx.medicine.create({
        data: {
          id: medicineId,      // 👈 per-shop medicine id
          hospital_Id: shopId,
          name: body.medicine_name,
          category: body.category,
          ndc_code: body.ndc_code,
          reorder: Number(body.reorder_level) || 0,
          stock: Number(body.total_stock), // initial stock
        },
      });

      // 2️⃣ CREATE BATCH
      const batch = await tx.medicineBatch.create({
        data: {
          hospital_Id: shopId,
          medicine_id: medicine.id,

          batch_no: body.batch_no,
          manufacture_date: new Date(body.mfg_date),
          expiry_date: new Date(body.exp_date),

          HSN: body.hsncode,
          rack_no: body.rack_no,

          quantity: Number(body.quantity),
          free_quantity: Number(body.free_quantity || 0),
          total_quantity: Number(body.total_quantity),
          unit: Number(body.unit),

          purchase_price_unit: Number(body.purchase_price_per_unit),
          purchase_price_quantity: Number(body.purchase_price_per_quantity),
          selling_price_unit: Number(body.selling_price_per_unit),
          selling_price_quantity: Number(body.selling_price_per_quantity),

          mrp: body.mrp ? Number(body.mrp) : undefined,
          profit: body.profit_percent
            ? Number(body.profit_percent)
            : undefined,

          purchase_details: body.purchase_details,
          supplier_id: Number(body.supplier_id),

          total_stock: Number(body.total_stock),
          is_active: true,
          created_at: new Date(),
        },
      });

      // 3️⃣ STOCK MOVEMENT
      await tx.stockMovement.create({
        data: {
          hospital_Id: shopId,
          batch_id: batch.id,
          movement_type: StockMovementType.IN,
          quantity: Number(body.total_stock),
          reason: body.reason ?? 'Bulk Medicine Upload',
        },
      });

      results.push({
        medicine_id: medicine.id,
        batch_id: batch.id,
      });
    }

    return {
      message: 'Bulk medicine upload successful',
      total_uploaded: results.length,
      data: results,
    };
  });
}

  async createBulkBatchWithStock(
  shopId: number,
  batches: any[],
) {
  return prisma.$transaction(async (tx) => {

    const results: { medicine_id: number; batch_id: number }[] = [];

    for (const body of batches) {
      const medicineId = Number(body.medicine_id);

      const dto: CreateBatchWithStockDto = {
        hospital_id: shopId,
        batch_no: body.batch_no,
        manufacture_date: body.mfg_date,
        expiry_date: body.exp_date,
        hsncode: body.hsncode,
        rack_no: body.rack_no,
        quantity: Number(body.quantity),
        free_quantity: Number(body.free_quantity || 0),
        total_quantity: Number(body.total_quantity),
        unit: Number(body.unit),
        total_stock: Number(body.total_stock),
        purchase_price_unit: Number(body.purchase_price_per_unit),
        purchase_price_quantity: Number(body.purchase_price_per_quantity),
        selling_price_unit: Number(body.selling_price_per_unit),
        selling_price_quantity: Number(body.selling_price_per_quantity),
        profit: body.profit_percent ? Number(body.profit_percent) : undefined,
        mrp: body.mrp ? Number(body.mrp) : undefined,
        purchase_details: body.purchase_details,
        supplier_id: Number(body.supplier_id),
        reason: body.reason ?? 'Bulk Upload',
      };

const batch = await tx.medicineBatch.create({
        data: {
          hospital_Id: dto.hospital_id,
          medicine_id: medicineId,

          batch_no: dto.batch_no,
          manufacture_date: new Date(dto.manufacture_date),
          expiry_date: new Date(dto.expiry_date),

          HSN: dto.hsncode,
          rack_no: dto.rack_no,

          quantity: dto.quantity,
          free_quantity: dto.free_quantity ?? 0,
          total_quantity: dto.total_quantity,
          unit: dto.unit,

          purchase_price_unit: dto.purchase_price_unit,
          purchase_price_quantity: dto.purchase_price_quantity,
          selling_price_unit: dto.selling_price_unit,
          selling_price_quantity: dto.selling_price_quantity,

          mrp: dto.mrp,
          profit: dto.profit,
          purchase_details: dto.purchase_details,

          supplier_id: dto.supplier_id,
          total_stock: dto.total_stock,

          is_active: true,
          created_at: new Date(),
        },
      });
   await tx.stockMovement.create({
        data: {
          hospital_Id: dto.hospital_id,
          batch_id: batch.id,
          movement_type: StockMovementType.IN,
          quantity: dto.total_stock,
          reason: dto.reason,
        },
      });
 await tx.medicine.update({
where: {
  hospital_Id_id: {
    hospital_Id: shopId,
    id: medicineId,
  },
},        data: {
          stock: { increment: dto.total_stock },
        },
      });
      results.push({
        medicine_id: medicineId,
        batch_id: batch.id,
      });
    }

    return {
      message: 'Bulk batch upload successful',
      total_uploaded: results.length,
      data: results,
    };
  });
}

async getMedicineStockHistory(shop_id: number) {
  return prisma.medicine.findMany({
    where: {
      hospital_Id: shop_id,
    },
    include: {
      batches: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
            },
          },
          movements: {
            orderBy: {
              movement_date: 'desc',
            },
          },
        },
        orderBy: {
          expiry_date: 'asc',
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });
}


   async checkBatchExists(
    shopId: number,
    medicineId: number,
    batchNo: string,
  ): Promise<boolean> {
    const batch = await prisma.medicineBatch.findFirst({
      where: {
        hospital_Id: shopId,
        medicine_id: medicineId,
        batch_no: batchNo,
      },
      select: { id: true },
    });

    return !!batch;
  }

   async isMedicineNameTaken(shop_id: number, name: string): Promise<boolean> {
    const existing = await prisma.medicine.findFirst({
      where: {
        hospital_Id: shop_id,
        name: {
          equals: name.trim(),
        },
      },
    });
    return !!existing;
  }

async createMedicineWithBatchAndStock(dto: CreateMedicineWithBatchDto) {
  return prisma.$transaction(async (tx) => {
const lastMedicine = await tx.medicine.findFirst({
  where: { hospital_Id: dto.hospital_id },
  orderBy: { id: 'desc' },
});

const medicineId = lastMedicine ? lastMedicine.id + 1 : 1;
    // 1️⃣ Create Medicine
    const medicine = await tx.medicine.create({
      data: {
        id: medicineId,      // 👈 per-shop medicine id
        hospital_Id: dto.hospital_id,
        name: dto.name,
        category: dto.category,
        ndc_code: dto.ndc_code,
        stock: dto.total_stock, // ✅ FIXED
        reorder: dto.reorder,
      },
    });

    // 2️⃣ Create Batch
    const batch = await tx.medicineBatch.create({
      data: {
        hospital_Id: dto.hospital_id,
        medicine_id: medicine.id,
        batch_no: dto.batch_no,
        manufacture_date: new Date(dto.manufacture_date),
        expiry_date: new Date(dto.expiry_date),
        HSN: dto.hsncode,

        quantity: dto.quantity,
        free_quantity: dto.free_quantity ?? 0,
        total_quantity: dto.total_quantity,
        unit: dto.unit,

        purchase_price_unit: dto.purchase_price_unit,
        purchase_price_quantity: dto.purchase_price_quantity,
        selling_price_unit: dto.selling_price_unit,
        selling_price_quantity: dto.selling_price_quantity,

        mrp: dto.mrp,
        profit: dto.profit,
        purchase_details: dto.purchase_details,

        rack_no: dto.rack_no,
        supplier_id: dto.supplier_id,

        total_stock: dto.total_stock, // ✅ FIXED
        is_active: true,
        created_at: new Date(),
      },
    });

    // 3️⃣ Stock Movement (IN)
    const stock = await tx.stockMovement.create({
      data: {
        hospital_Id: dto.hospital_id,
        batch_id: batch.id,
        movement_type: StockMovementType.IN,
        quantity: dto.total_stock, // ✅ FIXED
        reason: dto.reason,
      },
    });

    return { medicine, batch, stock };
  });
}


async createBatchWithStock(
  medicine_id: number,
  dto: CreateBatchWithStockDto,
) {
  return prisma.$transaction(async (tx) => {

    // 1️⃣ Create Batch
    const batch = await tx.medicineBatch.create({
      data: {
        hospital_Id: dto.hospital_id,
        medicine_id,

        batch_no: dto.batch_no,
        manufacture_date: new Date(dto.manufacture_date),
        expiry_date: new Date(dto.expiry_date),

        HSN: dto.hsncode,
        rack_no: dto.rack_no,

        quantity: dto.quantity,
        free_quantity: dto.free_quantity ?? 0,
        total_quantity: dto.total_quantity,
        unit: dto.unit,

        purchase_price_unit: dto.purchase_price_unit,
        purchase_price_quantity: dto.purchase_price_quantity,
        selling_price_unit: dto.selling_price_unit,
        selling_price_quantity: dto.selling_price_quantity,

        mrp: dto.mrp,
        profit: dto.profit,
        purchase_details: dto.purchase_details,

        supplier_id: dto.supplier_id,

        total_stock: dto.total_stock,
        is_active: true,
        created_at: new Date(),
      },
    });

    // 2️⃣ Stock IN
    const stock = await tx.stockMovement.create({
      data: {
        hospital_Id: dto.hospital_id,
        batch_id: batch.id,
        movement_type: StockMovementType.IN, // ✅ enum-safe
        quantity: dto.total_stock,
        reason: dto.reason,
      },
    });

    // 3️⃣ Update Medicine Stock
    await tx.medicine.update({
where: {
  hospital_Id_id: {
    hospital_Id: dto.hospital_id,
    id: medicine_id,
  },
},      data: {
        stock: { increment: dto.total_stock },
      },
    });

    return { batch, stock };
  });
}

async createBulkExistingMedicineWithStock(
  shopId: number,
  batches: any[],
) {
  if (!shopId || !Array.isArray(batches) || batches.length === 0) {
    throw new BadRequestException('Invalid payload');
  }

  return prisma.$transaction(async (tx) => {

    // ✅ FIX 1: explicitly type results
    const results: {
      medicine: any;
      batch: any;
      stock: any;
    }[] = [];

    // 🔹 get last medicine id ONCE
    const lastMedicine = await tx.medicine.findFirst({
      where: { hospital_Id: shopId },
      orderBy: { id: 'desc' },
    });

    let nextMedicineId = lastMedicine ? lastMedicine.id + 1 : 1;

    for (const b of batches) {

      // 🔴 validations (NDC optional)
      if (
        !b.medicine_name ||
        !b.category ||
        !b.batch_no ||
        !b.mfg_date ||
        !b.exp_date ||
        !b.unit ||
        Number(b.unit) <= 0 ||
        b.total_stock === undefined ||
        Number(b.total_stock) < 0
      ) {
        throw new BadRequestException(
          `Invalid data for medicine ${b.medicine_name ?? ''}`,
        );
      }

      // 1️⃣ Create Medicine
      const medicine = await tx.medicine.create({
        data: {
          id: nextMedicineId++,
          hospital_Id: shopId,
          name: b.medicine_name.trim(),
          category: b.category,
          ndc_code: b.ndc_code?.trim() || null, // ✅ optional
          reorder: Number(b.reorder_level ?? 0),
          stock: Number(b.total_stock),
          is_active: true,
        },
      });

      // 2️⃣ Create Batch
     const batch = await tx.medicineBatch.create({
  data: {
    batch_no: b.batch_no,
    rack_no: b.rack_no ?? null,

    manufacture_date: new Date(b.mfg_date),
    expiry_date: new Date(b.exp_date),

    unit: Number(b.unit),
    total_quantity: Number(b.total_quantity),
    quantity: Number(b.total_quantity), // ✅ REQUIRED
    total_stock: Number(b.total_stock),

    selling_price_unit: Number(b.selling_price_per_unit ?? 0),
    selling_price_quantity: Number(b.selling_price_per_quantity ?? 0),

    is_active: true,

    hospital: {
      connect: { id: shopId },
    },

    medicine: {
      connect: {
        hospital_Id_id: {
          hospital_Id: shopId,
          id: medicine.id,
        },
      },
    },
  },
});


      // 3️⃣ Stock Movement (IN)
      const stock = await tx.stockMovement.create({
        data: {
          hospital_Id: shopId,
          batch_id: batch.id,
          movement_type: StockMovementType.IN,
          quantity: Number(b.total_stock),
          reason: 'Initial Stock',
        },
      });

      results.push({ medicine, batch, stock });
    }

    return {
      count: results.length,
      message: 'Bulk existing medicine upload successful',
      data: results,
    };
  });
}

async createBulkBatchesForExistingMedicines(
  shopId: number,
  batches: any[],
) {
  return prisma.$transaction(async (tx) => {

  const results: {
  batch: MedicineBatch;
  stock: StockMovement;
}[] = [];


    for (const b of batches) {
      if (!b.medicine_id) {
        throw new BadRequestException('Medicine ID is required');
      }

      const dto: CreateExistingBatchDto = {
        hospital_id: shopId,
        batch_no: b.batch_no,
        rack_no: b.rack_no,
        mfg_date: b.mfg_date,
        exp_date: b.exp_date,
        total_stock: Number(b.total_stock),
        total_quantity: Number(b.total_quantity),
        unit: Number(b.unit),
        selling_price_per_unit: Number(b.selling_price_per_unit),
        selling_price_per_quantity: Number(b.selling_price_per_quantity),
      };

    const batch = await tx.medicineBatch.create({
  data: {
    batch_no: dto.batch_no,
    rack_no: dto.rack_no ?? null,

    manufacture_date: new Date(dto.mfg_date),
    expiry_date: new Date(dto.exp_date),

    unit: dto.unit,
    total_quantity: dto.total_quantity,
    quantity: dto.total_quantity, // ✅ REQUIRED
    total_stock: dto.total_stock,

    selling_price_unit: dto.selling_price_per_unit,
    selling_price_quantity: dto.selling_price_per_quantity,

    is_active: true,

    hospital: {
      connect: { id: shopId },
    },

    medicine: {
      connect: {
        hospital_Id_id: {
          hospital_Id: shopId,
          id: Number(b.medicine_id),
        },
      },
    },
  },
});


      const stock = await tx.stockMovement.create({
        data: {
          hospital_Id: shopId,
          batch_id: batch.id,
          movement_type: StockMovementType.IN,
          quantity: dto.total_stock,
          reason: 'Existing Batch Added',
        },
      });

      await tx.medicine.update({
        where: {
          hospital_Id_id: {
            hospital_Id: shopId,
            id: Number(b.medicine_id),
          },
        },
        data: {
          stock: { increment: dto.total_stock },
        },
      });

      results.push({ batch, stock });
    }

    return {
      count: results.length,
      message: 'Bulk batch upload for existing medicines successful',
      data: results,
    };
  });
}



   // ✅ Create existing medicine (single)
  async createExistingMedicine(dto: CreateExistingMedicineDto) {
    if (!dto.mfg_date || !dto.exp_date) {
  throw new BadRequestException('MFG and EXP dates are required');
}
if (!dto.unit || !dto.total_stock) {
  throw new BadRequestException('Unit and total stock must be valid numbers');
}
if (dto.unit === undefined || dto.unit <= 0) {
  throw new BadRequestException('Unit must be greater than 0');
}

if (dto.total_stock === undefined || dto.total_stock < 0) {
  throw new BadRequestException('Total stock must be 0 or more');
}

    return prisma.$transaction(async (tx) => {
      const lastMedicine = await tx.medicine.findFirst({
        where: { hospital_Id: dto.hospital_id },
        orderBy: { id: 'desc' },
      });

      const medicineId = lastMedicine ? lastMedicine.id + 1 : 1;

     const medicine = await tx.medicine.create({
  data: {
    id: medicineId,
    hospital_Id: dto.hospital_id,
    name: dto.name,
    category: dto.category,
    ndc_code: dto.ndc_code ?? null,
    stock: Number(dto.total_stock), // ✅ number
    reorder: dto.reorder ?? 0,
    is_active: true,
  },
});

 const batch = await tx.medicineBatch.create({
  data: {
    batch_no: dto.batch_no,

    manufacture_date: new Date(dto.mfg_date!),
    expiry_date: new Date(dto.exp_date!),

    total_quantity: Number(dto.total_quantity),
    unit: Number(dto.unit),
    quantity: Number(dto.total_quantity), // ✅ REQUIRED FIELD
    total_stock: Number(dto.total_stock),

    selling_price_unit: dto.selling_price_per_unit ?? 0,
    selling_price_quantity: dto.selling_price_per_quantity ?? 0,

    rack_no: dto.rack_no ?? null,
    is_active: true,

    // ✅ RELATIONS (this is the key)
    hospital: {
      connect: { id: dto.hospital_id },
    },

    medicine: {
      connect: {
        hospital_Id_id: {
          hospital_Id: dto.hospital_id,
          id: medicine.id,
        },
      },
    },
  },
});

      const stock = await tx.stockMovement.create({
  data: {
    hospital_Id: dto.hospital_id,
    batch_id: batch.id,
    movement_type: StockMovementType.IN,
    quantity: Number(dto.total_stock), // ✅ FIXED
    reason: 'Initial Stock',
  },
});


      return { medicine, batch, stock };
    });
  }

async getMedicineWithBatches(medicine_id: number,hospital_id: number) {
  return prisma.medicine.findUnique({
where: {
  hospital_Id_id: {
    hospital_Id: hospital_id,
    id: medicine_id,
  },
},
    include: {
      batches: {
        orderBy: { created_at: 'desc' },
        include: {
          movements: {
            orderBy: { movement_date: 'desc' },
          },
        },
      },
    },
  });
}

async getAllMedicinesWithBatches(shop_id: number) {
  return prisma.medicine.findMany({
    where: {
      hospital_Id: shop_id,
    },
    include: {
      batches: {
        where: {
          total_stock: {
            not: 0,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
            },
          },
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}


async updateMedicineOrBatchStatus(dto: UpdateInventoryStatusDto) {
  const { shop_id, medicine_id, batch_id, is_active } = dto;

  return prisma.$transaction(async (tx) => {

    // 🔹 CASE 1: Batch toggle only
    if (batch_id) {
      const batch = await tx.medicineBatch.updateMany({
        where: {
          id: batch_id,
          medicine_id,
          hospital_Id: shop_id,
        },
        data: {
          is_active,
        },
      });

      // If batch is being activated, ensure parent medicine is also active
      if (is_active) {
        const medicine = await tx.medicine.findUnique({
where: {
  hospital_Id_id: {
    hospital_Id: dto.shop_id,
    id: dto.medicine_id,
  },
},        });

        if (medicine && !medicine.is_active) {
          await tx.medicine.update({
where: {
  hospital_Id_id: {
    hospital_Id: dto.shop_id,
    id: dto.medicine_id,
  },
},         data: { is_active: true },
          });
        }
      }


      return {
        message: 'Batch status updated',
        batch_id,
        is_active,
      };
    }

    // 🔹 CASE 2: Medicine toggle (affects all batches)
    await tx.medicine.updateMany({
      where: {
        id: medicine_id,
        hospital_Id: shop_id,
      },
      data: {
        is_active,
      },
    });

    await tx.medicineBatch.updateMany({
      where: {
        medicine_id,
        hospital_Id: shop_id,
      },
      data: {
        is_active,
      },
    });

    return {
      message: 'Medicine and all batches status updated',
      medicine_id,
      is_active,
    };
  });
}

}

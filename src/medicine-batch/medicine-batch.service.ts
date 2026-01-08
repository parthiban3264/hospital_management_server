import { Injectable, BadRequestException,NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMedicineBatchDto } from './dto/create-medicine-batch.dto';

const prisma = new PrismaClient();

@Injectable()
export class MedicineBatchService {

   async getAvailableBatches(medicineId: number) {
    return prisma.medicineBatch.findMany({
      where: {
        medicine_id: medicineId,
        is_active: true,
        total_stock: { gt: 0 },
      },
      orderBy: [
        { expiry_date: 'asc' },   // 🔥 FIFO by expiry
        { created_at: 'asc' },    // 🔥 FIFO by arrival
      ],
      select: {
        id: true,
        batch_no: true,
        expiry_date: true,
        total_stock: true,
        quantity: true,
        unit: true,
        selling_price_unit: true,
      },
    });
  }
  
  create(dto: CreateMedicineBatchDto) {
    return prisma.medicineBatch.create({ data: dto });
  }

getExpiredMedicineBatches(shopId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // ⬅️ normalize

  return prisma.medicineBatch.findMany({
    where: {
      hospital_Id: shopId,
      expiry_date: {
        lte: today, // ✅ include today
      },
      total_stock: { not: 0 },
      is_active: true,
    },
    include: {
      medicine: true,
    },
    orderBy: {
      expiry_date: 'asc',
    },
  });
}

getDeactivatedMedicineBatches(shopId: number) {
  return prisma.medicineBatch.findMany({
    where: {
      hospital_Id: shopId,
      is_active: false,           // 🚫 deactivated batch
      total_stock: {
        not: 0,                   // 📦 still has stock
      },
    },
    include: {
      medicine: true,             // 💊 include medicine details
    },
    orderBy: {
      created_at: 'desc',
    },
  });
}

async removeBatch(
  shopId: number,
  medicineId: number,
  batchId: number,
) {
  return prisma.$transaction(async (tx) => {
    // 1️⃣ Fetch batch
    const batch = await tx.medicineBatch.findFirst({
      where: {
        id: batchId,
        medicine_id: medicineId,
        hospital_Id: shopId,
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const stockToRemove = batch.total_stock ?? 0;

    if (stockToRemove <= 0) {
      throw new BadRequestException('Batch already empty');
    }

    // 2️⃣ Update batch → stock 0
    await tx.medicineBatch.update({
      where: { id: batchId },
      data: {
        total_stock: 0,
        total_quantity: 0,
        is_active: false,
      },
    });

    // 3️⃣ Update medicine stock
    await tx.medicine.update({
      where: { id: medicineId },
      data: {
        stock: {
          decrement: stockToRemove,
        },
      },
    });

    // 4️⃣ Stock movement OUT
    await tx.stockMovement.create({
      data: {
        hospital_Id: shopId,
        batch_id: batchId,
        movement_type: 'OUT',
        quantity: stockToRemove,
        reason: batch.is_active ? 'expired' : 'deactivated',
        reference: `Batch ${batch.batch_no} removed`,
      },
    });

    return {
      success: true,
      message: 'Batch removed and stock updated',
    };
  });
}

  findAll(shop_id: number) {
    return prisma.medicineBatch.findMany({
      where: { hospital_Id:shop_id },
      include: { medicine: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findOne(id: number) {
    return prisma.medicineBatch.findUnique({ where: { id } });
  }

  update(id: number, dto: any) {
    return prisma.medicineBatch.update({
      where: { id },
      data: dto,
    });
  }

}

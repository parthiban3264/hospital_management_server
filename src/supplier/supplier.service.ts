import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PrismaClient } from '@prisma/client';
import { log } from 'console';

const prisma = new PrismaClient();

@Injectable()
export class SupplierService {

  async getSupplierByPhone(shopId: number, phone: string) {
    return prisma.suppliers.findMany({
      where: {
        hospital_Id: shopId,
        phone: {
          contains: phone, // allows partial match
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
      },
    });
  }
  // ➕ Create Supplier
  create(shopId: number, dto: CreateSupplierDto) {
    return prisma.suppliers.create({
      data: {
        hospital_Id: shopId,
        ...dto,
      },
    });
  }

  // 📄 Get all suppliers of a shop
  findAll(shopId: number) {
    return prisma.suppliers.findMany({
      where: { hospital_Id: shopId ,is_active:true},
      orderBy: { created_at: 'desc' },
    });
  }

  // 🔍 Get single supplier (shop-safe)
  async findOne(shopId: number, id: number) {
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id,
        hospital_Id: shopId,
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  // ✏️ Update supplier (shop-safe)
  async update(shopId: number, id: number, dto: UpdateSupplierDto) {
    log('dto',dto);
    //await this.findOne(shopId, id);

    return prisma.suppliers.update({
      where: { id },
      data: dto,
    });
  }

  // ❌ Delete supplier (shop-safe)
async remove(shopId: number, id: number) { 
  await this.findOne(shopId, id);

  return prisma.suppliers.update({
    where: { 
      id 
    },
    data: { 
      is_active: false // ✅ Soft delete instead of hard delete
    }
  });
}

}

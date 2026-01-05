import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import * as XLSX from 'xlsx';

@Injectable()
export class MedicianService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const medician = await this.prisma.medician.createMany({ data });
      return { status: "success", message: "Medician created", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const medicianList = await this.prisma.medician.findMany({
      include: { Hospital: true,},
    });
    return { status: "success", message: "Medicians fetched", data: medicianList };
  }

  async finfindAllByhospitaldAll(hospitalId: number) {
    const injections = await this.prisma.medician.findMany({
      where: { hospital_Id: Number(hospitalId) },
      // include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Injections fetched", data: injections };
  }

  async findOne(id: number) {
    const medician = await this.prisma.medician.findUnique({
      where: { id },
      include: { Hospital: true, },
    });
    if (!medician) throw new NotFoundException(`Medician with ID ${id} not found`);
    return { status: "success", message: "Medician fetched", data: medician };
  }

    async findById(id: number, hospitalId: number) {
    const medician = await this.prisma.medician.findUnique({
      where: { id ,hospital_Id: hospitalId},
      include: { Hospital: true,},
    });
    if (!medician) throw new NotFoundException(`Medician with ID ${id} not found`);
    return { status: "success", message: "Medician fetched", data: medician };
  }

async findByName(hospitalId: number, name: string) {
  // Try exact match first
  const exactMatch = await this.prisma.medician.findFirst({
    where: {
      medicianName: { equals: name },
      hospital_Id: hospitalId,
    },
    include: { Hospital: true },
  });

  // If no exact match, provide autocomplete suggestions
  if (!exactMatch) {
    const suggestions = await this.prisma.medician.findMany({
      where: {
        medicianName: { startsWith: name },
        hospital_Id: hospitalId,
      },
      take: 5,
      select: { id: true, medicianName: true, amount: true },
    });

    if (suggestions.length === 0) {
      throw new NotFoundException(
        `Medician with name "${name}" in hospital ID ${hospitalId} not found`
      );
    }

    // Return suggestions instead of error
    return {
      status: 'partial',
      message: 'No exact match found. Showing suggestions.',
      data: suggestions,
    };
  }

  // Return exact match
  return { status: 'success', message: 'Medician fetched', data: exactMatch };
}


  async update(id: number, data: any) {
    try {
      const medician = await this.prisma.medician.update({ where: { id }, data });
      return { status: "success", message: "Medician updated", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const medician = await this.prisma.medician.delete({ where: { id } });
      return { status: "success", message: "Medician deleted", data: medician };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
///////////////////////////////////////////////////////////new UPlaod excel method//////////////////////////////////////////////////////////

parseExcelDate(value: any): Date {
  if (typeof value === 'number') {
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  return new Date(value);
}


async importFromExcel(file: Express.Multer.File) {
  console.log('work1', file);
  const workbook = XLSX.read(file.buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const data: Prisma.MedicinesCreateManyInput[] = rows
    .filter((row: any) => row.name && row.costPrice && row.MRP)
    .map((row: any) => ({
      hospitalId: Number(row.hospitalId),

      name: String(row.name).trim(),
      code: row.code ? String(row.code).trim() : null,

      stock: Number(row.stock ?? 0),
      costPrice: Number(row.costPrice),
      MRP: Number(row.MRP),

      sellingPrice: row.sellingPrice != null ? Number(row.sellingPrice) : null,
      PTR: row.PTR != null ? Number(row.PTR) : null,

      HSNCode: row.HSNCode ? String(row.HSNCode) : null,

      discountPercent:
        row.discountPercent != null ? Number(row.discountPercent) : null,

      cgstPercent:
        row.cgstPercent != null ? Number(row.cgstPercent) : null,

      sgstPercent:
        row.sgstPercent != null ? Number(row.sgstPercent) : null,

      freeUnits:
        row.freeUnits != null ? Number(row.freeUnits) : null,

      producerId:
        row.producerId != null ? Number(row.producerId) : null,

      importerId:
        row.importerId != null ? Number(row.importerId) : null,

      unit: row.unit ? String(row.unit) : null,
      strength: row.strength ? String(row.strength) : null,
      batchNumber: row.batchNumber ? String(row.batchNumber) : null,

      expiryDate: row.expiryDate
        ? this.parseExcelDate(row.expiryDate)
        : null,

      manufacturingDate: row.manufacturingDate
        ? this.parseExcelDate(row.manufacturingDate)
        : null,

      minimumStock:
        row.minimumStock != null ? Number(row.minimumStock) : null,

      reorderLevel:
        row.reorderLevel != null ? Number(row.reorderLevel) : null,

      isPrescriptionRequired: row.isPrescriptionRequired === true,
      isActive: row.isActive !== false,

      storageCondition: row.storageCondition
        ? String(row.storageCondition)
        : null,

      notes: row.notes ? String(row.notes) : null,
    }));

  await this.prisma.medicines.createMany({
    data,
    skipDuplicates: true,
  });

  return {
    message: 'Excel uploaded successfully',
    inserted: data.length,
  };
}

async generateExcelTemplate(): Promise<Buffer> {
  const headers = [
    {
      hospitalId: '',
      name: '',
      code: '',
      stock: '',
      costPrice: '',
      MRP: '',
      sellingPrice: '',
      PTR: '',
      HSNCode: '',
      discountPercent: '',
      cgstPercent: '',
      sgstPercent: '',
      freeUnits: '',
      producerId: '',
      importerId: '',
      unit: '',
      strength: '',
      batchNumber: '',
      expiryDate: '',
      manufacturingDate: '',
      minimumStock: '',
      reorderLevel: '',
      isPrescriptionRequired: '',
      isActive: '',
      storageCondition: '',
      notes: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(headers);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medicines');

  return XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
  });
}

}

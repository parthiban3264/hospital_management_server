import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

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
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Medicians fetched", data: medicianList };
  }

  async finfindAllByhospitaldAll(hospitalId: number) {
    const injections = await this.prisma.medician.findMany({
      where: { hospital_Id: Number(hospitalId) },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Injections fetched", data: injections };
  }

  async findOne(id: number) {
    const medician = await this.prisma.medician.findUnique({
      where: { id },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    if (!medician) throw new NotFoundException(`Medician with ID ${id} not found`);
    return { status: "success", message: "Medician fetched", data: medician };
  }

    async findById(id: number, hospitalId: number) {
    const medician = await this.prisma.medician.findUnique({
      where: { id ,hospital_Id: hospitalId},
      include: { Hospital: true, MedicineAndInjection: true },
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
    include: { Hospital: true, MedicineAndInjection: true },
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
}

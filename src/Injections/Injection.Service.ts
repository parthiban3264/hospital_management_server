import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class InjectionService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const injection = await this.prisma.injection.createMany({data});
      return { status: "success", message: "Injection created", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const injections = await this.prisma.injection.findMany({
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Injections fetched", data: injections };
  }

   async finfindAllByhospitaldAll(hospitalId: number) {
    const injections = await this.prisma.injection.findMany({
      where: { hospital_Id: Number(hospitalId) },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "Injections fetched", data: injections };
  }

  async findOne(id: number) {
    const injection = await this.prisma.injection.findUnique({
      where: { id },
      include: { Hospital: true, MedicineAndInjection: true },
    });
    if (!injection) throw new NotFoundException(`Injection with ID ${id} not found`);
    return { status: "success", message: "Injection fetched", data: injection };
  }

  async findByHospitalAndName(hospital_Id: number, name: string) {
  // Try exact match first
  const exactMatch = await this.prisma.injection.findFirst({
    where: {
    injectionName: { equals: name },
      hospital_Id: Number(hospital_Id),
    },
    select: { id: true, injectionName: true, amount: true, stock: true },
  });

  if (exactMatch) {
    const stock =
      exactMatch.stock && Object.keys(exactMatch.stock).length > 0
        ? exactMatch.stock
        : 'Not Available';

    return {
      status: 'success',
      message: 'Tonic fetched successfully',
      data: { ...exactMatch, stock },
    };
  }

  // If no exact match, provide autocomplete-style suggestions
  const suggestions = await this.prisma.injection.findMany({
    where: {
        injectionName: { startsWith: name },
      hospital_Id: Number(hospital_Id),
      
    },
    take: 5,
    select: { id: true, injectionName: true, amount: true, stock: true },
  });

   if (!suggestions || suggestions.length === 0) {
    return {
      status: 'nosuggestion',
      message: 'No Suggestion',
      data: [],
    };
  }

//   Clean suggestion format: ensure empty stock shows “Not Available”
  const formattedSuggestions = suggestions.map((item) => ({
    ...item,
    stock:
      item.stock && Object.keys(item.stock).length > 0
        ? item.stock
        : 'Not Available',
  }));

  return {
    status: 'partial',
    message: 'No exact match found. Showing suggestions.',
    data: formattedSuggestions,
  };
}

  async update(id: number, data: any) {
    try {
      const injection = await this.prisma.injection.update({ where: { id }, data });
      return { status: "success", message: "Injection updated", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const injection = await this.prisma.injection.delete({ where: { id } });
      return { status: "success", message: "Injection deleted", data: injection };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

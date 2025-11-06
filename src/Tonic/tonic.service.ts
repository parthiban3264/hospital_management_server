import { Injectable,NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TonicService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    try{
const tonic = this.prisma.tonic.createMany({ data });
    return { status: 'success', message: 'Tonic created', data: tonic };
    }catch(error){
      return { status: 'failed', error: error.message };
    }
    
  }

  findAll() {
    return this.prisma.tonic.findMany();
  }

  findByHospital(hospital_Id: number) {
    return this.prisma.tonic.findMany({ where: { hospital_Id } });
  }
  async finfindAllByhospitaldAll(hospitalId: number) {
    const tonic = await this.prisma.tonic.findMany({
      where: { hospital_Id: Number(hospitalId) },
      // include: { Hospital: true, MedicineAndInjection: true },
    });
    return { status: "success", message: "tonics fetched", data: tonic };
  }

 async findByHospitalAndName(hospital_Id: number, name: string) {
  // Try exact match first
  const exactMatch = await this.prisma.tonic.findFirst({
    where: {
    tonicName: { equals: name },
      hospital_Id: Number(hospital_Id),
    },
    select: { id: true, tonicName: true, amount: true, stock: true },
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
  const suggestions = await this.prisma.tonic.findMany({
    where: {
        tonicName: { startsWith: name },
      hospital_Id: Number(hospital_Id),
      
    },
    take: 5,
    select: { id: true, tonicName: true, amount: true, stock: true },
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
  update(id: number, data: any) {
    return this.prisma.tonic.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.tonic.delete({ where: { id } });
  }
}

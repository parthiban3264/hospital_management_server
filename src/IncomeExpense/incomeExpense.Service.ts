import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IncomeAndExpenseService {
  constructor(private prisma: PrismaService) {}

  // Create
  async create(data: any) {
    return this.prisma.incomeAndExpense.create({ data });
  }

  // Find all
  async findAll(hospital_Id: number) {
    return this.prisma.incomeAndExpense.findMany({
      where: { hospital_Id },
    });
  }

  // Find one by id
  async findOne(id: number) {
    return this.prisma.incomeAndExpense.findUnique({ where: { id } });
  }

  // Update
  async update(id: number, data: any) {
    return this.prisma.incomeAndExpense.update({ where: { id }, data });
  }

  // Delete
  async remove(id: number) {
    return this.prisma.incomeAndExpense.delete({ where: { id } });
  }
}

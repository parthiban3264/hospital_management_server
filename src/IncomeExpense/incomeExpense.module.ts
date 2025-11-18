import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeAndExpenseController } from './incomeExpense.Controller';
import { IncomeAndExpenseService } from './incomeExpense.Service';

@Module({
  controllers: [IncomeAndExpenseController],
  providers: [IncomeAndExpenseService, PrismaService],
})
export class IncomeAndExpenseModule {}

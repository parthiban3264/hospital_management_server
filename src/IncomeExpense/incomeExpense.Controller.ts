import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { IncomeAndExpenseService } from './incomeExpense.Service';


@Controller('income_and_expense')
export class IncomeAndExpenseController {
  constructor(private readonly incomeAndExpenseService: IncomeAndExpenseService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.incomeAndExpenseService.create(body);
  }

  @Get('getAll/:hospitalId')
  findAll(@Param('hospitalId') hospital_Id: number) {
    return this.incomeAndExpenseService.findAll(Number(hospital_Id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incomeAndExpenseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.incomeAndExpenseService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incomeAndExpenseService.remove(+id);
  }
}

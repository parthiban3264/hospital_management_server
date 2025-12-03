import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FeesService } from './fees.service';

@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.feesService.create(body);
  }

  @Get('all')
  findAll() {
    return this.feesService.findAll();
  }

  @Get('all/:hospital_Id')
  findByHospital(@Param('hospital_Id') hospitalId: string) {
    return this.feesService.findByHospital(Number(hospitalId));
  }

  @Get('getById/:id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(+id);
  }

  @Patch('updateById/:id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.feesService.update(+id, body);
  }

  @Delete('delecteById/:id')
  remove(@Param('id') id: string) {
    return this.feesService.remove(+id);
  }
}

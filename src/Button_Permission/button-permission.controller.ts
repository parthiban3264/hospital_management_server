import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { ButtonPermissionService } from './button-permission.service';
import { get } from 'http';
import { log } from 'console';

@Controller('button-permissions')
export class ButtonPermissionController {
  constructor(private readonly service: ButtonPermissionService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.service.create(body);
  }
   @Post('createMany')
  createMany(@Body() body: any[]) {
    log('body', body);
    // body should be an array of objects
    return this.service.createMany(body);
  }

  @Get('getAll')
  findAll() {
    log('getAll called');
    return this.service.findAll();
  }
  // this not used currently
  @Get('getAll/:hospital_Id')
  findAllByHospital(@Param('hospital_Id') hospital_Id: string) {
    return this.service.findAllByHospital(Number(hospital_Id));
  }

  @Get('getById/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch('updateById/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete('deleteById/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

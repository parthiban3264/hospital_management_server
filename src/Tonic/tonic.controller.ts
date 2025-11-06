import { Controller, Get, Post, Body, Param, Patch, Delete, Query } from '@nestjs/common';
import { TonicService } from './tonic.service';

@Controller('tonics')
export class TonicController {
  constructor(private readonly tonicService: TonicService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.tonicService.create(data);
  }
   @Get('all/:hospitalId')
  findAllByhospital(@Param('hospitalId') hospitalId: number) {
    return this.tonicService.finfindAllByhospitaldAll(hospitalId);
  }

  @Get('all/:hospital_Id/:tonicName')
  findAll(@Query('hospital_Id') hospital_Id: string, @Query('tonicName') tonicName: string) {
    if (hospital_Id && tonicName) {
      return this.tonicService.findByHospitalAndName(+hospital_Id, tonicName);
    } else if (hospital_Id) {
      return this.tonicService.findByHospital(+hospital_Id);
    } else {
      return this.tonicService.findAll();
    }
  }

  @Get("getByName/:hospitalId/:name")
  findByName(@Param("hospitalId") hospitalId : number ,@Param("name") name: string) {
    console.log(hospitalId,name);
    
    return this.tonicService.findByHospitalAndName(Number(hospitalId), name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.tonicService.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tonicService.remove(+id);
  }
}

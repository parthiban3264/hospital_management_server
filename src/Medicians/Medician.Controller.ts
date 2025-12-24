import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { MedicianService } from './Medician.Service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { join } from 'path';

@Controller('medicians')
export class MedicianController {
  constructor(private readonly service: MedicianService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get('all/:hospitalId')
  findAllByhospital(@Param('hospitalId') hospitalId: number) {
    return this.service.finfindAllByhospitaldAll(hospitalId);
  }

  @Get('getById/:id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }
  @Get('getById/:hospitalId/:id')
  findById(@Param('hospitalId') hospitalId: number, @Param('id') id: number) {
    return this.service.findById(Number(hospitalId), +id);
  }

  @Get('getByName/:hospitalId/:name')
  findByName(
    @Param('hospitalId') hospitalId: number,
    @Param('name') name: string,
  ) {
    console.log(hospitalId, name);

    return this.service.findByName(Number(hospitalId), name);
  }

  @Patch('updateById/:id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete('deleteById/:id')
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }

  ///////////////////////////////////////////////////new UPlaod excel method//////////////////////////////////////////////////////////

  @Post('upload-excel')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    console.log('work', file);
    
    return this.service.importFromExcel(file);
  }

  @Get('excel-template')
async downloadExcel(): Promise<StreamableFile> {
  const buffer = await this.service.generateExcelTemplate();

  return new StreamableFile(buffer, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    disposition: 'attachment; filename=medicine_template.xlsx',
  });
}


}

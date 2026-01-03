import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { ScanAndTestUnitReferenceService } from './scan-and-test-unit-reference.service';

@Controller('scan-and-test-unit-reference')
export class ScanAndTestUnitReferenceController {
  constructor(private readonly service: ScanAndTestUnitReferenceService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('hospital/:hospitalId')
  findByHospital(@Param('hospitalId') hospitalId: string) {
    return this.service.findByHospital(Number(hospitalId));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(Number(id));
  }
}

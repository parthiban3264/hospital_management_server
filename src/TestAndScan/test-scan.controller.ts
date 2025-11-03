import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';

import { TestAndScanService } from './test-scan.service';
import { Types } from '@prisma/client';

@Controller('scan_test')
export class ScanAndTestController {
  constructor(private readonly testScanService: TestAndScanService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.testScanService.create(body);
  }

  @Get('all/:hospital_Id/:type')
  findAll(
    @Param('hospital_Id') hospital_Id: string,
    @Param('type') type: string,
  ) {
    console.log('Type received:', type);
    // Convert hospital_Id to number and ensure type matches the enum (SCAN | TEST)
    return this.testScanService.findAll(
      Number(hospital_Id),
      type.toUpperCase() as Types,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.testScanService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.testScanService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testScanService.remove(id);
  }
}

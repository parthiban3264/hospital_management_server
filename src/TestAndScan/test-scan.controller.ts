// import {
//   Controller,
//   Get,
//   Post,
//   Patch,
//   Delete,
//   Param,
//   Body,
//   ParseIntPipe,
// } from '@nestjs/common';

// import { TestAndScanService } from './test-scan.service';
// import { Types } from '@prisma/client';

// @Controller('scan_test')
// export class ScanAndTestController {
//   constructor(private readonly testScanService: TestAndScanService) {}

//   @Post('create')
//   create(@Body() body: any) {
//     return this.testScanService.create(body);
//   }

//   @Get('all/:hospital_Id/:type')
//   findAll(
//     @Param('hospital_Id') hospital_Id: string,
//     @Param('type') type: string,
//   ) {
//     console.log('Type received:', type);
//     // Convert hospital_Id to number and ensure type matches the enum (SCAN | TEST)
//     return this.testScanService.findAll(
//       Number(hospital_Id),
//       type.toUpperCase() as Types,
//     );
//   }

//   @Get(':id')
//   findOne(@Param('id', ParseIntPipe) id: number) {
//     return this.testScanService.findOne(id);
//   }

//   @Patch(':id')
//   update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
//     return this.testScanService.update(id, body);
//   }

//   @Delete(':id')
//   remove(@Param('id', ParseIntPipe) id: number) {
//     return this.testScanService.remove(id);
//   }
// }


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
import { log } from 'console';

@Controller('scan_test')
export class ScanAndTestController {
  constructor(private readonly testScanService: TestAndScanService) {}

  // ✅ CREATE MULTIPLE TESTS
  @Post('create')
  create(@Body() body: any) {
    log('Create body received:', body);
    return this.testScanService.create(body);
  }

  // ✅ GET ALL TESTS BY HOSPITAL + TYPE
  @Get('all/:hospital_Id/:type')
  findAll(
    @Param('hospital_Id') hospital_Id: string,
    @Param('type') type: string,
  ) {
    return this.testScanService.findAll(
      Number(hospital_Id),
      type.toUpperCase() as Types,
    );
  }

  // ✅ GET ONE TEST
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.testScanService.findOne(id);
  }

  // ✅ GET ONE TEST WITH FULL UNIT/REFERENCE DATA
  @Get('details/:id')
  findOneWithReference(@Param('id', ParseIntPipe) id: number) {
    return this.testScanService.getTestWithUnitReference(id);
  }

  // ✅ UPDATE TEST
  @Patch('updateById/:id')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.testScanService.update(id, body);
  }

  // ✅ DELETE TEST
  @Delete('deleteById/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.testScanService.remove(id);
  }

  // // ✅ CREATE OR UPDATE UNIT/REFERENCE
  // @Post('unit_reference')
  // upsertUnitReference(@Body() body: any) {
  //   const { optionName, unit, referance } = body;
  //   return this.testScanService.upsertManyUnitReferences(optionName, unit, referance);
  // }
  @Post('unit_references/upsert_many')
async upsertManyUnitReferences(@Body() body: any[]) {
  return this.testScanService.upsertManyUnitReferences(body);
}


  // ✅ GET ALL UNIT REFERENCES
  @Get('unit-reference/all')
  getAllUnitReferences() {
    return this.testScanService.getAllUnitReferences();
  }

  // ✅ GET UNIT REFERENCE BY NAME
  @Get('unit-reference/:optionName')
  getUnitReference(@Param('optionName') optionName: string) {
    return this.testScanService.getUnitReference(optionName);
  }

  // ✅ DELETE UNIT REFERENCE
  @Delete('unit-reference/:optionName')
  deleteUnitReference(@Param('optionName') optionName: string) {
    return this.testScanService.deleteUnitReference(optionName);
  }
}

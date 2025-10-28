import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
import { TestingAndScanningPatientService } from "./testingAndScanningPatient.service";

@Controller("testing_and_scanning_patient")
export class TestingAndScanningPatientController {
  constructor(private readonly service: TestingAndScanningPatientService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get('all/:hospital_Id/:type')
  findAllTestandScanByType(@Param('hospital_Id') hospital_Id: number, @Param('type') type: string) {
    return this.service.findAllTestandScanByType(Number(hospital_Id), type);
  }
   @Get('all/:hospital_Id')
  findAllTestandScan(@Param('hospital_Id') hospital_Id: number) {
    return this.service.finfindAllTestandScan(Number(hospital_Id));
  }
  @Patch('update-payment-status/:paymentId')
  async updateTestingAndScanning(@Param('paymentId') paymentId: number) {
    try {
      const result = await this.service.updateTestingAndScanningByPayment(paymentId);
      return result;
    } catch (error) {
      console.error('Error updating testing & scanning records:', error);
      return {
        success: false,
        message: 'Failed to update testing & scanning records.',
        error: error.message,
      };
    }
  }

  @Get("getById/:id")
  findOne(@Param("id") id: number) {
    return this.service.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: number, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: number) {
    return this.service.remove(+id);
  }
}

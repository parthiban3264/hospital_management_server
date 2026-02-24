import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';
import { log } from 'console';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  // 🧑‍⚕️ CREATE PRESCRIPTION
  @Post()
  create(@Req() req, @Body() dto: CreatePrescriptionDto) {
    log('prescription', dto);
    return this.prescriptionService.createPrescriptionAndDispense(dto);
  }
  @Post('updateAndCreateMedicineAdministration/:id')
  async medicineAdministration(@Param('id') id: string, @Body() dto: any) {
    log('update administea', id, dto);
    return this.prescriptionService.medicineAdministarion(Number(id), dto);
  }
  @Get('medical-prescriptions/:hospital_Id')
  async getMedicalPrescription(@Param('hospital_Id') hospital_Id: string) {
    log('hospital', hospital_Id);
    return this.prescriptionService.getMedicalPrescription(Number(hospital_Id));
  }

  // 🏥 DISPENSE MEDICINE
  //   @Post('dispense')
  //   dispense(@Req() req, @Body() dto: DispenseMedicineDto) {
  //      const pharmacist_Id = Number(req.user.id);
  //     return this.prescriptionService.dispenseMedicine(
  //       dto
  //       pharmacist_Id
  //     );
  //   }

  // prescription.controller.ts
  // @Post('dispense')
  // async dispenseMedicine(
  //   @Req() req,
  //   @Body() dto: DispenseMedicineDto,
  // ) {
  //     log('dispense',dto);
  //   // assume pharmacist logged in

  //   return this.prescriptionService.dispenseMedicine(
  //     dto,
  //   );
  // }

  // 📄 GET PRESCRIPTION DETAILS
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionService.getPrescription(+id);
  }

  @Patch('prescriptionDispense/:id')
  async updatePrescriptionDispenseQuantity(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.prescriptionService.updatePrescriptionDispenseQuantity(
      +id,
      dto.dispensed_quantity,
      dto.amount,
      dto.batchNo,
      dto.days,
    );
    // Example of updating prescription dispense status
  }
}

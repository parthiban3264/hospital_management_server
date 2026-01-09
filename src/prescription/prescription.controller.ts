import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { PrescriptionService } from './prescription.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { DispenseMedicineDto } from './dto/dispense-medicine.dto';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  // 🧑‍⚕️ CREATE PRESCRIPTION
  @Post()
  create(@Req() req, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionService.createPrescription(
      req.user.hospital_Id,
      dto
    );
  }

  // 🏥 DISPENSE MEDICINE
  @Post('dispense')
  dispense(@Req() req, @Body() dto: DispenseMedicineDto) {
    return this.prescriptionService.dispenseMedicine(
      req.user.hospital_Id,
      req.user.id,
      dto
    );
  }

  // 📄 GET PRESCRIPTION DETAILS
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionService.getPrescription(+id);
  }
}

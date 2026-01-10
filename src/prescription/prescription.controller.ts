import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
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
    log('prescription',dto);
    return this.prescriptionService.createPrescription(
      dto
    );
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
@Post('dispense')
async dispenseMedicine(
  @Req() req,
  @Body() dto: DispenseMedicineDto,
) {
    log('dispense',dto);
  // assume pharmacist logged in

  return this.prescriptionService.dispenseMedicine(
    dto,
  );
}

  // 📄 GET PRESCRIPTION DETAILS
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prescriptionService.getPrescription(+id);
  }
}

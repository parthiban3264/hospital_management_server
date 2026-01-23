import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CreateChargeDto } from './dto/create-charge.dto';
import { ChargesService } from './charges.service';
import { log } from 'console';
@Controller('charges')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

@Post()
create(@Body() dto: CreateChargeDto) {
  return this.chargesService.create(dto);
}

 @Get('hospital/:hospital_Id/pending')
  findPendingByHospital(@Param('hospital_Id') hospital_Id: number) {
    return this.chargesService.findPendingByHospital(+hospital_Id);
  }

  @Patch('admissionId')
updateChargesupdateChargesAdvance( @Body() dto: any) {
   console.log('Updating charges for admission:',dto);
  return this.chargesService.updateCharges( dto);
}


  @Patch('admissionId/advance')
updateChargesAdvance( @Body() dto: any) {
   console.log('Updating charges for admission:',dto);
  return this.chargesService.updateChargesAdvance( dto);
}
@Patch(':id')
update(@Param('id') id: number, @Body() dto: CreateChargeDto) {
  return this.chargesService.update(+id, dto);
}


@Delete(':id')
remove(@Param('id') id: number) {
  return this.chargesService.remove(+id);
}
}
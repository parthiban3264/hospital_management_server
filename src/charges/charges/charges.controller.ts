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
@Controller('charge')
export class ChargesController {
  constructor(private readonly chargesService: ChargesService) {}

@Post()
create(@Body() dto: CreateChargeDto) {
  return this.chargesService.create(dto);
}

@Get('admission/:admissionId')
findByAdmission(@Param('admissionId') id: number) {
  return this.chargesService.findByAdmission(+id);
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
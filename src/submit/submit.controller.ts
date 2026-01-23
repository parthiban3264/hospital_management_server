// submit-ticket.controller.ts
import { Controller, Get, Post, Param, Body, Patch, Delete } from '@nestjs/common';
import { SubmitTicketService } from './submit.service';
import { CreateSubmitTicketDto } from './dto/create-submit.dto';

@Controller('submit-ticket')
export class SubmitTicketController {
  constructor(private readonly service: SubmitTicketService) {}

  @Post('create/:hospital_Id')
  create(@Param('hospital_Id') hospital_Id: string,@Body() dto: CreateSubmitTicketDto) {
    return this.service.create(dto,Number(hospital_Id));
  }

  @Get('hospital/:hospital_Id')
  findAllByShop(@Param('hospital_Id') hospital_Id: string) {
    return this.service.findAllByShop(Number(hospital_Id));
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}

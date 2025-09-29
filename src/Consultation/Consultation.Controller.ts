import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
import { ConsultationService } from "./consultation.service";

@Controller("consultations")
export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
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

import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
import { MedicianService } from "./Medician.Service";

@Controller("medicians")
export class MedicianController {
  constructor(private readonly service: MedicianService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get('all/:hospitalId')
  findAllByhospital(@Param('hospitalId') hospitalId: number) {
    return this.service.finfindAllByhospitaldAll(hospitalId);
  }

  @Get("getById/:id")
  findOne(@Param("id") id: number) {
    return this.service.findOne(+id);
  }
   @Get("getById/:hospitalId/:id")
  findById(@Param("hospitalId") hospitalId:number,@Param("id") id: number) {
    return this.service.findById(Number(hospitalId), +id);
  }

   @Get("getByName/:hospitalId/:name")
  findByName(@Param("hospitalId") hospitalId : number ,@Param("name") name: string) {
    console.log(hospitalId,name);
    
    return this.service.findByName(Number(hospitalId), name);
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

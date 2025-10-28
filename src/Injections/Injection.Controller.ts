import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
import { InjectionService } from "./Injection.Service";

@Controller("injections")
export class InjectionController {
  constructor(private readonly service: InjectionService) {}

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
    @Get("getByName/:hospitalId/:name")
  findByHospitalAndName(@Param("hospitalId") hospitalId : number ,@Param("name") name: string) {
    console.log(hospitalId,name);
    
    return this.service.findByHospitalAndName(Number(hospitalId), name);
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

import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { HospitalService } from "./hospital.service";

@Controller("hospitals")
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  // Corrected create endpoint
  @Post("create")
  create(@Body() data: any) {
    // Only send scalar fields to the service
    const { name, address, photo, HospitalStatus, phone, mail } = data;
    return this.hospitalService.create({ name, address, photo, HospitalStatus, phone, mail });
  }

  @Get("all")
  findAll() {
    return this.hospitalService.findAll();
  }

  @Get("getById/:id")
  findOne(@Param("id") id: string) {
    return this.hospitalService.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.hospitalService.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.hospitalService.remove(+id);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admins")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post("create")
  create(@Body() data: any) {
    return this.adminService.create(data);
  }

  @Get("all")
  findAll() {
    return this.adminService.findAll();
  }

  @Get("getById/:id")
  findOne(@Param("id") id: string) {
    return this.adminService.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.adminService.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.adminService.remove(+id);
  }
}

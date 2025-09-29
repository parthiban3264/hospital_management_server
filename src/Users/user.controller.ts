import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  create(@Body() data: any) {
    const { hospital_Id, user_Id, password, role } = data;
    return this.userService.create({
      hospital_Id,
      user_Id,
      password,
      role,
    });
  }

  @Get("all")
  findAll() {
    return this.userService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.userService.update(+id, data);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.userService.remove(+id);
  }
}

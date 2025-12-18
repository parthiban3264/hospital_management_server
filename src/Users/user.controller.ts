// import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
// import { UserService } from "./user.service";

// @Controller("users")
// export class UserController {
//   constructor(private readonly userService: UserService) {}

//   @Post("create")
//   create(@Body() data: any) {
//     const { hospital_Id, user_Id, password, role } = data;
//     return this.userService.create({
//       hospital_Id,
//       user_Id,
//       password,
//       role,
//     });
//   }

//   @Get("all")
//   findAll() {
//     return this.userService.findAll();
//   }

//   @Get(":id")
//   findOne(@Param("id") id: string) {
//     return this.userService.findOne(+id);
//   }

//   @Patch(":id")
//   update(@Param("id") id: string, @Body() data: any) {
//     return this.userService.update(+id, data);
//   }

//   @Delete(":id")
//   remove(@Param("id") id: string) {
//     return this.userService.remove(+id);
//   }
// }

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Request,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { JwtAuthGuard } from "../jwt/jwt-auth.guard";
import { log } from "console";
import { AuthGuard } from "@nestjs/passport";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("create")
  create(@Body() data: any) {
    return this.userService.create(data);
  }

  @Get("all")
  findAll() {
    return this.userService.findAll();
  }

  @Get("getById/:id")
  findOne(@Param("id") id: string) {
    return this.userService.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.userService.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.userService.remove(+id);
  }

  // -------------------- LOGIN --------------------
  @Post("login")
  login(@Body() data: any) {
    console.log("Login attempt:", data);
    return this.userService.login(data);
  }
 
  // -------------------- LOGOUT --------------------
   
  @Post('logout/:hospital_Id/:id')
  async logout(@Param("hospital_Id") hospital_Id: string, @Param("id") id: string) {
    log('Logout request received:', id);
    // req.user is set by JWT AuthGuard
    const userId = id; 
    return this.userService.logout(userId, Number(hospital_Id));
  }
//  @Post('force-logout')
//   forceLogout(@Body() data: any) {
//     return this.userService.forceLogout(data);
//   }



  // -------------------- PROTECTED ROUTE EXAMPLE --------------------
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@Request() req) {
    return { message: "Protected data", user: req.user };
  }

  @Post('CheckOldPassword/:id')
async checkOldPassword(@Param('id') id: string, @Body() body: any) {
  const { oldPassword } = body;

  if (!oldPassword) throw new BadRequestException('Old password required');

  const valid = await this.userService.verifyOldPassword(+id, oldPassword);

  // ✅ return JSON with boolean
  return { result: valid };
}


  @Patch('ChangePassword/:id')
  async changePassword(@Param('id') id: string, @Body() body: any) {
    const { newPassword } = body;
    if (!newPassword || newPassword.length < 4)
      throw new BadRequestException('New password is required');

    return this.userService.updatePassword(+id, newPassword);
  }

@Get('GetByUserId/:userId/:hospital_Id')
  async getByUserId(
    @Param('userId') userId: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    // ✅ Must return the service result
    return await this.userService.getByUserId(userId, Number(hospital_Id));
  }

}

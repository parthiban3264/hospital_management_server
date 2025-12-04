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
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Req() req) {
    log('Logout request received:', req.user);
    // req.user is set by JWT AuthGuard
    const userId = req.user.sub; 
    return this.userService.logout(userId);
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
}

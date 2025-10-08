// // import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
// // import { AdminStratorService } from "./AdminStrator.Service";

// // @Controller("adminstrators")
// // export class AdminStratorController {
// //   constructor(private readonly service: AdminStratorService) {}

// //   @Post('create')
// //   create(@Body() data: any) {
// //     return this.service.create(data);
// //   }

// //   @Get('all')
// //   findAll() {
// //     return this.service.findAll();
// //   }

// //   @Get("getById/:id")
// //   findOne(@Param("id") id: number) {
// //     return this.service.findOne(+id);
// //   }

// //   @Patch("updateById/:id")
// //   update(@Param("id") id: number, @Body() data: any) {
// //     return this.service.update(+id, data);
// //   }

// //   @Delete("deleteById/:id")
// //   remove(@Param("id") id: number) {
// //     return this.service.remove(+id);
// //   }
// // }

// import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
// import { AdminStratorService } from "./AdminStrator.Service";

// @Controller("adminstrators")
// export class AdminStratorController {
//   constructor(private readonly service: AdminStratorService) {}

//   // Create a new admin
//   @Post("create")
//   create(@Body() data: any) {
//     return this.service.create(data);
//   }

//   // Get all admins
//   @Get("all")
//   findAll() {
//     return this.service.findAll();
//   }

//   // Get single admin by user_Id
//   @Get("getByUserId/:user_Id")
//   findOne(@Param("user_Id") user_Id: string) {
//     return this.service.findOneByUserId(user_Id);
//   }

//   // Update admin by user_Id
//   @Patch("updateByUserId/:user_Id")
//   update(@Param("user_Id") user_Id: string, @Body() data: any) {
//     return this.service.updateByUserId(user_Id, data);
//   }

//   // Delete admin by user_Id
//   @Delete("deleteByUserId/:user_Id")
//   remove(@Param("user_Id") user_Id: string) {
//     return this.service.removeByUserId(user_Id);
//   }
// }

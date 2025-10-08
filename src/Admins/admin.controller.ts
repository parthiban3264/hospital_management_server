import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { AdminService } from "./admin.service";

@Controller("admins")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @Post("create")
  // create(@Body() data: any) {
  //   return this.adminService.create(data);
  // }

     @Post('create')
    async create(@Body() createPatientDto: any) {
      try {
        // Call service method to create user + admins
        const result = await this.adminService.createAdminWithUser(createPatientDto);
  
        return {
          statusCode: HttpStatus.CREATED,
          message: 'Patient and User created successfully',
          data: result,
        };
      } catch (error) {
        console.error(error);
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Failed to create patient and user',
            details: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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

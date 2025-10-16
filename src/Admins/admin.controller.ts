import { Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Patch, Post } from "@nestjs/common";
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
 @Get("all/:hospital_Id/:role")
async findAllByHospital(
  @Param('hospital_Id') hospital_Id: string,
  @Param('role') role: string
) {
  return this.adminService.findAllByHospitalAndRole(Number(hospital_Id), role);
}


  // @Get("getById/:id")
  // findOne(@Param("id") id: string) {
  //   return this.adminService.findOne(+id);
  // }
   @Get('getByUser/:hospitalId/:userId')
  async findByUser(
    @Param('hospitalId') hospitalId: string,
    @Param('userId') userId: string,
  ) {
    const admin = await this.adminService.findByUser(hospitalId, userId);
    if (!admin) {
      throw new NotFoundException(
        `Admin with hospitalId ${hospitalId} and userId ${userId} not found`,
      );
    }
    return { status: 'success', data: admin };
  }

  // @Patch("updateById/:id")
  // update(@Param("id") id: string, @Body() data: any) {
  //   return this.adminService.update(+id, data);
  // }

   @Patch("update/:hospital_Id/:user_Id")
  updateByHospitalAndUser(
    @Param("hospital_Id") hospital_Id: string,
    @Param("user_Id") user_Id: string,
    @Body() data: any
  ) {
    return this.adminService.updateByAdmin(
      +hospital_Id,
      user_Id,
      data
    );
  }
  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.adminService.remove(+id);
  }
}

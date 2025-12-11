import { BadRequestException, Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Patch, Post } from "@nestjs/common";
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
    const result = await this.adminService.createAdminWithUser(createPatientDto);

    // 🔹 If user already exists, return proper error response
    if (!result.success) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: result.message, // e.g. "This phone number is already registered"
        data: null,
      };
    }

    // 🔹 Success response
    return {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: 'Admin created successfully',
      data: result,
    };

  } catch (error) {
    console.error(error);

    // 🔹 Unexpected error response
    throw new HttpException(
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Failed to create admin and user',
        details: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
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

 @Get("all/:hospital_Id")
async getAllByHospitalAdmin(
  @Param('hospital_Id') hospital_Id: string,
) {
  return this.adminService.findAllByHospitalAdmin(Number(hospital_Id));
}
  @Patch("updateById/:id")
  update(@Param("id") id: string, @Body() data: any) {
    console.log('updateId',data ,id);
    
    return this.adminService.update(+id, data);
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

  // @Patch("ResetPassword/:id")
  // resetPassword(@Param("id") id: string ,@Body() newPassword: string) {
  //   return this.adminService.resetPassword(+id,newPassword);
  // }
  
}




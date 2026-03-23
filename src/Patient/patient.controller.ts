// import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
// import { PatientService } from './PatientService';

// @Controller('patients')
// export class PatientController {
//   constructor(private readonly patientService: PatientService) {}

//   // Create patient
//   @Post('create')
//   async create(@Body() body: any) {
//     return this.patientService.create(body);
//   }

//   // Get all patients
//   @Get('all')
//   async findAll() {
//     return this.patientService.findAll();
//   }

//   // Get single patient by ID
//   @Get('getById/:id')
//   async findOne(@Param('id') id: string) {
//     return this.patientService.findOne(Number(id));
//   }

//   // Update patient
//   @Patch('updeteById/:id')
//   async update(@Param('id') id: string, @Body() body: any) {
//     return this.patientService.update(Number(id), body);
//   }

//   // Delete patient
//   @Delete('deleteById/:id')
//   async delete(@Param('id') id: string) {
//     return this.patientService.delete(Number(id));
//   }
// }

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { PatientService } from './PatientService';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  // @Post('create')
  // async create(@Body() body: any) {
  //   console.log('body work', body);
  //   return this.patientService.create(body);
  // }
  @Post('create')
  async create(@Body() createPatientDto: any) {
    try {
      console.log(createPatientDto);

      // Call service method to create user + patient
      const result =
        await this.patientService.createPatientWithUser(createPatientDto);

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

  @Get('get/bldGrp/:hospital_Id')
  async takePatientBloodGrp(@Param('hospital_Id') hospital_Id: string) {
    return this.patientService.takePatientBloodGrp(Number(hospital_Id));
  }

  @Get('all')
  async findAll() {
    return this.patientService.findAll();
  }

  // ✅ Get by hospital_Id (int) + user_Id (string)
  @Get('get/:hospital_Id/:user_Id')
  async findOne(
    @Param('hospital_Id') hospital_Id: string,
    @Param('user_Id') user_Id: string,
  ) {
    return this.patientService.findOneByUserId(Number(hospital_Id), user_Id);
  }

  @Get('get/check/:hospital_Id/:user_Id')
  async findCheckUserId(
    @Param('hospital_Id') hospital_Id: string,
    @Param('user_Id') user_Id: string,
  ) {
    return this.patientService.findCheckUserId(Number(hospital_Id), user_Id);
  }

  // ✅ Update
  @Patch('update/:hospital_Id/:user_Id')
  async update(
    @Param('hospital_Id') hospital_Id: string,
    @Param('user_Id') user_Id: string,
    @Body() body: any,
  ) {
    console.log(
      'Updating patient for hospital_Id:',
      hospital_Id,
      'and user_Id:',
      user_Id,
      body,
    );

    return this.patientService.updateByUserId(
      Number(hospital_Id),
      user_Id,
      body,
    );
  }

  // ✅ Delete
  @Delete('delete/:hospital_Id/:user_Id')
  async delete(
    @Param('hospital_Id') hospital_Id: string,
    @Param('user_Id') user_Id: string,
  ) {
    return this.patientService.deleteByUserId(Number(hospital_Id), user_Id);
  }
}

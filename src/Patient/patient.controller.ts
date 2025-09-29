import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { PatientService } from './PatientService';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  // Create patient
  @Post('create')
  async create(@Body() body: any) {
    return this.patientService.create(body);
  }

  // Get all patients
  @Get('all')
  async findAll() {
    return this.patientService.findAll();
  }

  // Get single patient by ID
  @Get('getById/:id')
  async findOne(@Param('id') id: string) {
    return this.patientService.findOne(Number(id));
  }

  // Update patient
  @Patch('updeteById/:id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.patientService.update(Number(id), body);
  }

  // Delete patient
  @Delete('deleteById/:id')
  async delete(@Param('id') id: string) {
    return this.patientService.delete(Number(id));
  }
}

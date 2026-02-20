import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { log } from 'console';

@Controller('admissions')
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}
  @Get('patients/by-id/:id/:hospital_Id')
  getPatientById(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.admissionService.findById(Number(id), Number(hospital_Id));
  }

  @Patch(':id/:hospital_Id/change-assignment')
  changeAssignment(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body() body: { doctorId?: number; nurseId?: number; newBedId?: number },
  ) {
    return this.admissionService.changeAssignment(
      +id,
      body,
      Number(hospital_Id),
    );
  }
  @Patch(':admissionId/staff-change')
  async addStaffChange(
    @Param('admissionId') admissionId: string,
    @Body() staffChanges: any[],
  ) {
    return this.admissionService.addStaffChange(
      Number(admissionId),
      staffChanges,
    );
  }
  // admission.controller.ts

  @Get(':hospital_Id/admitted')
  async getAdmittedAdmissions(@Param('hospital_Id') hospital_Id: string) {
    return this.admissionService.getAdmittedAdmissions(Number(hospital_Id));
  }

  @Get('patients/all/:hospital_Id')
  getAllPatients(@Param('hospital_Id') hospital_Id: string) {
    log('Fetching all patients', { hospital_Id });
    return this.admissionService.findAllPatients(Number(hospital_Id));
  }

  @Post(':hospital_Id/admit')
  admitPatient(@Body() dto: any, @Param('hospital_Id') hospital_Id: String) {
    log('dto', dto);
    return this.admissionService.admitPatient(dto, Number(hospital_Id));
  }

  @Get('patients/by-phone/:phone/:hospital_Id')
  getPatientsByPhone(
    @Param('phone') phone: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    log('phone work', phone, hospital_Id);
    return this.admissionService.findByPhone(phone, Number(hospital_Id));
  }

  @Get(':hospital_Id/staff/doctors')
  getDoctors(@Param('hospital_Id') hospital_Id: string) {
    return this.admissionService.getDoctors(Number(hospital_Id));
  }

  @Get(':hospital_Id/staff/nurses')
  getNurses(@Param('hospital_Id') hospital_Id: string) {
    return this.admissionService.getNurses(Number(hospital_Id));
  }

  // Get all admissions
  @Get(':hospital_Id')
  getAllAdmissions(@Param('hospital_Id') hospital_Id: String) {
    return this.admissionService.getAllAdmissions(Number(hospital_Id));
  }
  @Patch('discharge1/:id')
  async dischargeAdmission(@Param('id') id: number) {
    return this.admissionService.dischargeAdmission(Number(id));
  }

  @Patch('notes/edit/:id')
  editNote(
    @Param('id') id: string,
    @Body()
    body: {
      noteType: 'notes' | 'drNotes';
      date: string;
      index: number;
      text: string;
    },
  ) {
    return this.admissionService.editNote(
      Number(id),
      body.noteType,
      body.date,
      body.index,
      body.text,
    );
  }
  @Patch('updateInstruction/:instrctionId')
  editInstruction(@Param('instrctionId') id: number, @Body() dto: any) {
    return this.admissionService.editInstruction(+id, dto);
  }
   @Delete('deleteInstruction/:instrctionId')
  deleteInstruction(@Param('instrctionId') id: number, @Body() dto: any) {
    return this.admissionService.deleteInstruction(+id, dto);
  }

  @Patch('notes/:id/:noteType')
  async AdmissionNotes(
    @Param('id') id: number,
    @Param('noteType') noteType: string,
    @Body() body: any,
  ) {
    return this.admissionService.updateAdmissionNotes(
      Number(id),
      body,
      noteType,
    );
  }

  @Patch('update/doctor-instruction/:id')
  async updateDoctorInstruction(@Param('id') id: number, @Body() body: any) {
    return this.admissionService.updateDoctorInstruction(Number(id), body);
  }

  @Post('create/doctor-instruction/:admissionId')
  async createDoctorInstruction(
    @Param('admissionId') admissionId: string,
    @Body() body: any,
  ) {
    return this.admissionService.createDoctorInstruction(
      Number(admissionId),
      body,
    );
  }

  @Get('get/doctor-instructions/:admissionId')
  async getDoctorInstructions(@Param('admissionId') admissionId: string) {
    return this.admissionService.getDoctorInstructions(Number(admissionId));
  }

  /// 🗑 DELETE NOTE
  @Delete('notes/delete/:id')
  deleteNote(
    @Param('id') id: string,
    @Body()
    body: {
      noteType: 'notes' | 'drNotes';
      date: string;
      index: number;
    },
  ) {
    return this.admissionService.deleteNote(
      Number(id),
      body.noteType,
      body.date,
      body.index,
    );
  }

  // Get admission by ID
  @Get(':id/:hospital_Id')
  getAdmissionById(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.admissionService.getAdmissionById(+id, Number(hospital_Id));
  }

  // Update admission
  @Patch(':id/:hospital_Id')
  updateAdmission(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body()
    body: {
      doctorId?: number;
      nurseId?: number;
      bedId?: number;
      wardChange?: any;
      attenderDetail?: any;
      oldDoctorDetail?: any;
      dischargeTime?: Date;
      status?: 'ADMITTED' | 'DISCHARGED' | 'CANCELLED';
    },
  ) {
    return this.admissionService.updateAdmission(
      +id,
      body,
      Number(hospital_Id),
    );
  }

  @Patch('admissionId/status/:id')
  updateStatus(@Param('id') id: number, @Body() dto: any) {
    console.log('Updating charges for admission:', id);
    return this.admissionService.updateStatus(+id, dto);
  }

  // Delete admission
  @Delete(':id/:hospital_Id')
  deleteAdmission(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.admissionService.deleteAdmission(+id, Number(hospital_Id));
  }

 
}

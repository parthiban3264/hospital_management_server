import { Controller, Get, Post, Put, Delete, Body, Param, Patch, BadRequestException } from "@nestjs/common";
import { ConsultationService } from "./Consultation.Service";
import { QueueStatus } from "@prisma/client";

@Controller("consultations")
export class ConsultationController {
  constructor(private readonly service: ConsultationService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all')
  findAll() {
    return this.service.findAll();
  }

   @Get('all/:hospitalId')
  async findAllByHospitalOverview(@Param('hospitalId') hospitalId: number) {
    
    const consultations = await this.service.findAllByHospitalOverview(hospitalId);
    return { status: 'success', message: 'Consultations fetched', data: consultations };
  }
  
   @Get('all/drqueue/:hospitalId')
  async findAllByHospitalDrQueue(@Param('hospitalId') hospitalId: number) {
    
    const consultations = await this.service.findAllByHospitalDrQueue(hospitalId);
    return { status: 'success', message: 'Consultations fetched', data: consultations };
  }

   @Get('all/ByMedical/:hospitalId/:mode')
  async findAllByMedical(@Param('hospitalId') hospitalId: number,@Param('mode') mode: number) {
    
    const consultations = await this.service.findAllByMedical(hospitalId,mode);
    return { status: 'success', message: 'Consultations fetched', data: consultations };
  }

  @Get('all/:hospitalId/Doctor/:doctorId')
  async findByHospitalDoctor(@Param('hospitalId') hospitalId: number, @Param('doctorId') doctorId: string) {
    const consultations = await this.service.findByHospitalDoctor(hospitalId, doctorId);
    return { status: 'success', message: 'Consultations fetched', data: consultations };
  }

  @Get("getById/:id")
  findOne(@Param("id") id: number) {
   return this.service.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: number, @Body() data: any) {
     console.log('Consulatation id',id);
    return this.service.update(+id, data);
  }
   @Patch(':id/queue-status')
  async updateQueueStatus(
    @Param('id') id: string,
    @Body('queueStatus') queueStatus: string,
  ) {
    // Validate input against the enum
    if (!Object.values(QueueStatus).includes(queueStatus as QueueStatus)) {
      throw new BadRequestException(`Invalid queue status: ${queueStatus}`);
    }

    return this.service.updateQueueStatus(Number(id), queueStatus as QueueStatus);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: number) {
    return this.service.remove(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { WardService } from './ward.service';
import { log } from 'console';

@Controller('wards')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  // Create Ward
  @Post(':hospital_Id')
  createWard(
    @Param('hospital_Id') hospital_Id: string,
    @Body() body: { name: string; type: string; beds: any },
  ) {
    log('wards:', body, hospital_Id);
    //limit value is :  12582912000
    // wards: {
    //   name: 'testing',
    //   type: 'General',
    //   beds: [
    //     { bedNo: 45, status: 'AVAILABLE' },
    //     { bedNo: 87, status: 'AVAILABLE' }
    //   ]
    // } 1

    return this.wardService.createWard(body, Number(hospital_Id));
  }

  // Get All Wards
  @Get('all/:hospital_Id')
  getAllWards(@Param('hospital_Id') hospital_Id: string) {
    return this.wardService.getAllWards(Number(hospital_Id));
  }
  @Get(':hospital_Id/available-beds')
  getAvailableBeds(@Param('hospital_Id') hospital_Id: String) {
    log('hospital_Id', hospital_Id);
    return this.wardService.getAvailableBeds(Number(hospital_Id));
  }
  // Get Ward by ID
  @Get(':id/:hospital_Id')
  getWardById(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.wardService.getWardById(+id, Number(hospital_Id));
  }

  // Update Ward
  @Patch(':id/:hospital_Id')
  updateWard(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body() body: { name?: string; type?: string },
  ) {
    return this.wardService.updateWard(+id, body, Number(hospital_Id));
  }

  // Delete Ward
  @Delete(':id/:hospital_Id')
  deleteWard(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.wardService.deleteWard(+id, Number(hospital_Id));
  }

  // Create Bed
  @Post(':id/:hospital_Id/beds')
  createBed(
    @Param('id') wardId: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body() body: { bedNo: number },
  ) {
    return this.wardService.createBed(+wardId, body.bedNo, Number(hospital_Id));
  }

  @Patch(':id/fullUpdate/:hospital_Id')
  updateWardWithBeds(
    @Param('id') id: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body()
    body: {
      name?: string;
      type?: string;
      beds?: {
        id: number;
        bedNo?: number;
        status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
      }[];
    },
  ) {
    return this.wardService.updateWardWithBeds(+id, body, Number(hospital_Id));
  }

  // Update Bed (number / status)
  @Patch('beds/:bedId/:hospital_Id')
  updateBed(
    @Param('bedId') bedId: string,
    @Param('hospital_Id') hospital_Id: string,
    @Body()
    body: {
      bedNo?: number;
      status?: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
    },
  ) {
    return this.wardService.updateBed(+bedId, body, Number(hospital_Id));
  }

  // Delete Bed
  @Delete('beds/:bedId/:hospital_Id')
  deleteBed(
    @Param('bedId') bedId: string,
    @Param('hospital_Id') hospital_Id: string,
  ) {
    return this.wardService.deleteBed(+bedId, Number(hospital_Id));
  }
}

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    BadRequestException,
} from '@nestjs/common';
import { AAScanAndTestingService } from './a_a_scan_and_testing.service';
import { CreateScanTestDto } from './dto/create-scan-test.dto';
import { UpdateScanTestDto } from './dto/update-scan-test.dto';
 

@Controller('a_scanning_testing')
export class AAScanAndTestingController {
    constructor(
        private readonly aAScanAndTestingService: AAScanAndTestingService,
    ) { }

    @Get('all/:hospital_Id')
    async getAllByHospital(@Param('hospital_Id') hospital_Id: string) {
         

        return this.aAScanAndTestingService.findAllByHospital(
            Number(hospital_Id),
        );
    }

    @Post()
    async create(@Body() dto: CreateScanTestDto) {
        if (!dto.hospital_Id) {
            throw new BadRequestException('hospital_Id is required');
        }
        return this.aAScanAndTestingService.create(dto);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateScanTestDto,
    ) {
        return this.aAScanAndTestingService.update(Number(id), dto);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.aAScanAndTestingService.delete(Number(id));
    }
    @Delete('option/:id')
    async deletePotion(@Param('id') id: string) {
        return this.aAScanAndTestingService.deleteOption(Number(id));
    }
    @Patch('status/:id')
    async updateStatus(@Param('id') id: string,@Body('isActive') isActive:boolean) {
        return this.aAScanAndTestingService.updateStatus(Number(id),isActive);
    }
    @Patch('status/option/:id')
    async updateStatusOptions(@Param('id') id: string,@Body('isActive') isActive:boolean) {
        return this.aAScanAndTestingService.updateStatusOptions(Number(id),isActive);
    }
}
import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { DrawerService } from './drawer.Service';

@Controller('drawers')
export class DrawerController {
  constructor(private readonly drawerService: DrawerService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.drawerService.create(body);
  }

  @Get('getAll/:hospitalId')
  findAll(@Param('hospitalId') hospital_Id: number) {
    return this.drawerService.findAll(Number(hospital_Id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.drawerService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.drawerService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.drawerService.remove(+id);
  }
}

import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { CosmeticService } from './cosmetic.service';

@Controller('cosmetics')
export class CosmeticController {
  constructor(private readonly cosmeticService: CosmeticService) {}

  @Post()
  create(@Body() body: any) {
    return this.cosmeticService.create(body);
  }

  @Get()
  findAll() {
    return this.cosmeticService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cosmeticService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.cosmeticService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cosmeticService.remove(+id);
  }
}

// import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
// import { CosmeticService } from './cosmetic.service';

// @Controller('cosmetics')
// export class CosmeticController {
//   constructor(private readonly cosmeticService: CosmeticService) {}

//   @Post('create')
//   create(@Body() body: any[]) {
//     console.log('work');
    
//     return this.cosmeticService.create(body);
//   }

//   @Get('getAll/:hospital_Id')
//   findAll(@Param('hospital_Id') hospital_Id: string) {
//     return this.cosmeticService.findAll(Number(hospital_Id));
//   }

//   @Get('getById/:id')
//   findOne(@Param('id') id: string) {
//     return this.cosmeticService.findOne(+id);
//   }

//   @Patch('updateById/:id')
//   update(@Param('id') id: string, @Body() body: any) {
//     return this.cosmeticService.update(+id, body);
//   }

//   @Delete('deleteById/:id')
//   remove(@Param('id') id: string) {
//     return this.cosmeticService.remove(+id);
//   }
// }

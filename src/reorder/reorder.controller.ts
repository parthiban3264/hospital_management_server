import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ReorderService } from './reorder.service';
import { CreateOrderDto } from './dto/reorder.dto';

@Controller('reorder')
export class ReorderController {
  constructor(private readonly Service: ReorderService) {}

  @Get(':shopId')
  async getReorderList(
    @Param('shopId', ParseIntPipe) shopId: number,
  ) {
    return this.Service.getReorderMedicinesWithSupplier(shopId);
  }
    @Post('order/:shopId')
  async createOrder(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Body() dto: CreateOrderDto,
  ) {
    return this.Service.createMedicineOrder(shopId, dto);
  }

  @Get('supplier-wise/:shopId')
  async getSupplierWiseReorder(
    @Param('shopId', ParseIntPipe) shopId: number,
  ) {
    return this.Service.getSupplierWiseReorderList(shopId);
  }
  
}

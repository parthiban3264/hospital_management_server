import { Controller, Post, Body, Param, Patch, Get, Query, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryStatusDto } from './dto/update-inventory-status.dto';
import { CreateMedicineWithBatchDto } from './dto/create-medicine-with-batch.dto';
import { CreateBatchWithStockDto } from './dto/create-batch-with-stock.dto';
import { CreateExistingMedicineDto } from './dto/exist-medicine.dto';
import { CreateExistingBatchDto } from './dto/CreateExistingBatchDto.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Post('medicine/:medicineId/batch-exist')
async createBatchForExistingMedicine(
  @Param('medicineId') medicineId: string,
  @Body() body: any,
) {
  const dto: CreateExistingBatchDto = {
    hospital_id: Number(body.hospital_id),

    batch_no: body.batch_no,
    mfg_date: body.mfg_date,
    exp_date: body.exp_date,

    rack_no: body.rack_no,

    total_quantity: Number(body.total_quantity),
    unit: Number(body.unit),
    total_stock: Number(body.total_stock),

    selling_price_per_unit: Number(body.selling_price_per_unit),
    selling_price_per_quantity: Number(body.selling_price_per_quantity),

    reason: body.reason ?? 'Existing Batch Added',
  };

  return this.service.createBatchForExistingMedicine(
    Number(medicineId),
    dto,
  );
}

@Post('medicine/existing-med')
  async createExisting(@Body() body: CreateExistingMedicineDto) {
    return this.service.createExistingMedicine(body);
  }

    @Get('medicine/categories/:hospital_id')
getExtraCategories(@Param('hospital_id') hospital_id: string) {
  return this.service.getExtraCategories(+hospital_id);
}

  @Post('medicine/batch-upload')
async bulkBatchUpload(@Body() body: any) {
  const hospitalId = Number(body.shop_id);
  const batches = body.batches ?? [];

  return this.service.createBulkBatchWithStock(hospitalId, batches);
}

@Post('medicine/medicine-upload')
async bulkMedicineUpload(@Body() body: any) {
  const hospitalId = Number(body.shop_id);
  const batches = body.batches ?? [];

  return this.service.createBulkMedicineWithBatchAndStock(hospitalId, batches);
}

@Post('medicine')
async createMedicine(@Body() body: any) {
  const dto: CreateMedicineWithBatchDto = {
    hospital_id: Number(body.hospital_id),
    name: body.name,
    category: body.category,

    ndc_code: body.ndc_code,
    reorder: body.reorder,

    batch_no: body.batch_no,
    manufacture_date: body.mfg_date,
    expiry_date: body.exp_date,

    hsncode: body.hsncode,
    rack_no: body.rack_no,

    quantity: Number(body.quantity),
    free_quantity: Number(body.free_quantity || 0),
    total_quantity: Number(body.total_quantity),
    unit: Number(body.unit),
    total_stock: Number(body.total_stock),

    purchase_price_unit: Number(body.purchase_price_per_unit),
    purchase_price_quantity: Number(body.purchase_price_per_quantity),
    selling_price_unit: Number(body.selling_price_per_unit),
    selling_price_quantity: Number(body.selling_price_per_quantity),

    profit: Number(body.profit_percent),
    mrp: body.mrp ? Number(body.mrp) : undefined,

    purchase_details: body.purchase_details,

    supplier_id: body.supplier_id,
 
    reason: 'Initial Stock',
  };

  return this.service.createMedicineWithBatchAndStock(dto);
}

@Post('medicine/medicine-exist-upload')
async bulkExistingMedicineUpload(@Body() body: any) {
  const hospitalId = Number(body.shop_id);
  const batches = body.batches ?? [];

  return this.service.createBulkExistingMedicineWithStock(
    hospitalId,
    batches,
  );
}

@Post('medicine/batch-upload-exist')
async bulkExistingBatchUpload(@Body() body: any) {
  const shopId = Number(body.shop_id);
  const batches = body.batches;

  if (!shopId || !Array.isArray(batches) || batches.length === 0) {
    throw new BadRequestException('Invalid payload');
  }

  return this.service.createBulkBatchesForExistingMedicines(
    shopId,
    batches,
  );
}

  @Get('history/:hospital_id')
getAllMedicineHistory(
  @Param('hospital_id', ParseIntPipe) hospital_id: number,
) {
  return this.service.getMedicineStockHistory(hospital_id);
}

  @Patch('status')
  updateStatus(@Body() dto: UpdateInventoryStatusDto) {
    return this.service.updateMedicineOrBatchStatus(dto);
  }

  @Get('medicine/:hospital_id/:medicineId/validate-batch')
  async validateBatchNo(
    @Param('hospital_id') hospital_id: string,
    @Param('medicineId') medicineId: string,
    @Query('batch_no') batchNo: string,
  ) {
    if (!hospital_id || !medicineId || !batchNo) {
      throw new BadRequestException(
        'hospital_id, medicineId and batch_no are required',
      );
    }

    const exists = await this.service.checkBatchExists(
      Number(hospital_id),
      Number(medicineId),
      batchNo.trim(),
    );

    return {
      is_valid: !exists, // ✅ frontend expects this
    };
  }

  @Get('medicine/check-name/:shopId')
  async checkMedicineName(
    @Param('shopId') shopId: string,
    @Query('name') name: string,
  ) {
    if (!shopId || !name) {
      return { exists: false, message: 'shop_id and name are required' };
    }
    const exists = await this.service.isMedicineNameTaken(
      Number(shopId),
      name,
    );

    return { exists };
  }
  // Create Medicine + Batch + Stock


  // Create Batch + Stock for existing medicine
  
@Post('medicine/:medicineId/batch')
createBatch(
  @Param('medicineId') medicineId: string,
  @Body() body: any,
) {
  const dto: CreateBatchWithStockDto = {
    hospital_id: Number(body.hospital_id),

    batch_no: body.batch_no,
    manufacture_date: body.mfg_date,
    expiry_date: body.exp_date,

    hsncode: body.hsncode,
    rack_no: body.rack_no,

    quantity: Number(body.quantity),
    free_quantity: Number(body.free_quantity || 0),
    total_quantity: Number(body.total_quantity),
    unit: Number(body.unit),

    total_stock: Number(body.total_stock), // ✅ FIX

    purchase_price_unit: Number(body.purchase_price_per_unit),
    purchase_price_quantity: Number(body.purchase_price_per_quantity),
    selling_price_unit: Number(body.selling_price_per_unit),
    selling_price_quantity: Number(body.selling_price_per_quantity),

    profit: body.profit_percent ? Number(body.profit_percent) : undefined,
    mrp: body.mrp ? Number(body.mrp) : undefined,

    purchase_details: body.purchase_details,

    supplier_id: body.supplier_id,

    reason: body.reason ?? 'New Batch',
  };

  return this.service.createBatchWithStock(Number(medicineId), dto);
}

@Get('medicine/:id/shop/:hospital_id')
getMedicine(@Param('id') id: string, @Param('hospital_id') hospital_id: string) {
  return this.service.getMedicineWithBatches(+id, +hospital_id);
}

@Get('medicine/shop/:hospital_id')
getAllMedicines(@Param('hospital_id') hospital_id: string) {
  return this.service.getAllMedicinesWithBatches(+hospital_id);
}

}

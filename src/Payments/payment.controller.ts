import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Post('create/supplementary')
  supplementarybillcreate(@Body() data: any) {
    return this.service.supplementarybillcreate(data);
  }

  @Get('all/:hospitalId')
  findAll(@Param('hospitalId') hospitalId: number) {
    return this.service.findAll(Number(hospitalId));
  }

  @Get('all/overview/:hospitalId')
  findAllOverview(@Param('hospitalId') hospitalId: number) {
    return this.service.findAllOverview(Number(hospitalId));
  }

  @Get('one/:hospitalId/:id')
  findOnes(@Param('hospitalId') hospitalId: number, @Param('id') id: number) {
    return this.service.findOnes(Number(hospitalId), id);
  }

  @Get('all/pending/:hospitalId')
  async getPendingPayments(@Param('hospitalId') hospitalId: number) {
    return this.service.findPendingPaymentsByHospital(hospitalId);
  }
  @Get('all/pendingFee/:hospitalId')
  async getPendingPayment(@Param('hospitalId') hospitalId: number) {
    return this.service.findPendingPaymentsByHospitalNew(Number(hospitalId));
  }

  @Get('all/ct-scan/pendingFee/:hospitalId')
  async getCtScanPendingPayment(@Param('hospitalId') hospitalId: number) {
    return this.service.findCtScanPendingPaymentsByHospitalNew(
      Number(hospitalId),
    );
  }

  @Get('all/initial/pendingFee/:hospitalId')
  async getInitialPendingPayment(@Param('hospitalId') hospitalId: number) {
    return this.service.findInitialPendingPaymentsByHospitalNew(
      Number(hospitalId),
    );
  }

  //  @Get('all/limited/pendingFee/:hospitalId')
  // async getLimitedPendingPayment(@Param('hospitalId') hospitalId: number) {
  //   return this.service.findPendingLimitedPaymentsByHospitalNew(hospitalId);
  // }

  @Get('all/limited/pendingFee/:hospitalId')
  async getLimitedPendingPayment(
    @Param('hospitalId') hospitalId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findPendingLimitedPaymentsByHospitalNew(
      Number(hospitalId),
      Number(page),
      Number(limit),
    );
  }
  @Get('all/pendingTestFee/:hospitalId')
  async getPendingTestPayment(@Param('hospitalId') hospitalId: number) {
    return this.service.findPendingPaymentsByHospitalNewTest(hospitalId);
  }
  @Get('all/paid/:hospitalId')
  async getPaidPayments(@Param('hospitalId') hospitalId: number) {
    return this.service.findPendingPaidByHospital(hospitalId);
  }

  @Get('all/paidFee/:hospitalId')
  async getPaidPayment(@Param('hospitalId') hospitalId: number) {
    return this.service.findPendingPaidByHospitalNew(hospitalId);
  }
  @Get('all/paid/Accounts/:hospitalId')
  async getPaidAccounts(@Param('hospitalId') hospitalId: number) {
    return this.service.findPaidByHospitalAccounts(hospitalId);
  }

  @Get('all/paid/Accounts/filterData/:hospitalId')
  async getPaidAccountsFilterData(
    @Param('hospitalId') hospitalId: number,
    @Query('day') day?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.service.findPaidByHospitalAccountsFilterData(
      hospitalId,
      day?.toString(),
      month,
      year,
    );
  }

  @Get('getById/:id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(+id);
  }

  @Patch('updateById/:id')
  update(@Param('id') id: number, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Patch('updateById/decreaseAmount/:id')
  decreaseAmount(@Param('id') id: number, @Body() data: any) {
    return this.service.decreaseAmount(+id, data);
  }

  @Delete('deleteById/:id')
  remove(@Param('id') id: number) {
    return this.service.remove(+id);
  }
}

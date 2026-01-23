import {
  Controller,
  Post,
  Get,
  Param,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { AppPaymentService } from './app-payment.service';
import { AppPaymentStatus } from '@prisma/client';

@Controller('api/app-payment')
export class AppPaymentController {
  constructor(private readonly appPaymentService: AppPaymentService) {}

  @Get('hospital-details/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appPaymentService.findOne(id);
  }

  // ✅ Create yearly payment
  @Post('create/:hospitalId')
  async createPayment(
    @Param('hospitalId', ParseIntPipe) hospitalId: number,
    @Body('transactionId') transactionId?: string,
  ) {
    return this.appPaymentService.createYearlyPayment(hospitalId, transactionId);
  }

  // ✅ Update payment status
  @Post('update-status/:paymentId')
  async updateStatus(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Body() body: { status: AppPaymentStatus; transactionId?: string },
  ) {
    return this.appPaymentService.updatePaymentStatus(
      paymentId,
      body.status,
      body.transactionId,
    );
  }

  // ✅ Get current/latest payment
  @Get('current/:hospitalId')
  async getCurrentPayment(@Param('hospitalId', ParseIntPipe) hospitalId: number) {
    return this.appPaymentService.getCurrentPayment(hospitalId);
  }

  // ✅ Get payment history
  @Get('history/:hospitalId')
  async getPaymentHistory(@Param('hospitalId', ParseIntPipe) hospitalId: number) {
    return this.appPaymentService.getPaymentHistory(hospitalId);
  }

  // ✅ Expire old payments manually
  @Post('expire')
  async expireOldPayments() {
    return this.appPaymentService.expireOldPayments();
  }
}

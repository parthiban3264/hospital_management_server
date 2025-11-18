import { Controller, Get, Post, Put, Delete, Body, Param, Patch } from "@nestjs/common";
import { PaymentService } from "./payment.service";

@Controller("payments")
export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Get('all/:hospitalId')
  findAll(@Param('hospitalId') hospitalId: number) {
    return this.service.findAll(Number(hospitalId));
  }

  @Get('all/pending/:hospitalId')
async getPendingPayments(@Param('hospitalId') hospitalId: number) {
  return this.service.findPendingPaymentsByHospital(hospitalId);
}

  @Get('all/paid/:hospitalId')
async getPaidPayments(@Param('hospitalId') hospitalId: number) {
  return this.service.findPendingPaidByHospital(hospitalId);
}
  @Get('all/paid/Accounts/:hospitalId')
async getPaidAccounts(@Param('hospitalId') hospitalId: number) {
  return this.service.findPaidByHospitalAccounts(hospitalId);
}


  @Get("getById/:id")
  findOne(@Param("id") id: number) {
    return this.service.findOne(+id);
  }

  @Patch("updateById/:id")
  update(@Param("id") id: number, @Body() data: any) {
    return this.service.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: number) {
    return this.service.remove(+id);
  }
}

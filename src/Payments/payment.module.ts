import { Module } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
    exports: [PaymentService],
})
export class PaymentModule {}

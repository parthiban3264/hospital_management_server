import { ChargeStatus } from "@prisma/client";

export class CreateChargeDto {
  admissionId: number;
  description: string;
  amount: number;
  status: ChargeStatus;

}

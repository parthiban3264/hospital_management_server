import { Decimal } from "generated/prisma/runtime/library";

export class CreatePrescriptionDto {
  hospital_Id:string;
  patient_Id: number;
  doctor_Id: number;
  consultation_Id?: number;
  notes?: string;
  follow_up_date?: Date;
  valid_till?: Date;
  createdAt: any;
  pharmacist_Id: string;
  batch_No: string;

  medicines: {
    medicine_Id: number;
    dosage?: string;
    route: string;
    frequency?: string;
    days: any;
    total_quantity: number;
    afterEat?: boolean;
    morning?: boolean;
    afternoon?: boolean;
    night?: boolean;
    instructions?: string;
    batch_No: string;
  }[];
}

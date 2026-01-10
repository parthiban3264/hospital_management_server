export class CreatePrescriptionDto {
  hospital_Id:string;
  patient_Id: number;
  doctor_Id: number;
  consultation_Id?: number;
  notes?: string;
  follow_up_date?: Date;
  valid_till?: Date;

  medicines: {
    medicine_Id: number;
    dosage?: string;
    route: string;
    frequency?: string;
    days: number;
    total_quantity: number;
    after_food?: boolean;
    morning?: boolean;
    afternoon?: boolean;
    night?: boolean;
    instructions?: string;
  }[];
}

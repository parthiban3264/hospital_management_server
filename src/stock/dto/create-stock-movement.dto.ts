import { IsInt, IsString } from 'class-validator';

export class CreateStockMovementDto {
  @IsInt() hospital_Id: number;
  @IsInt() batch_id: number;
  @IsInt() quantity: number;

  @IsString() movement_type: 'IN' | 'OUT';
  @IsString() reason: string;
  reference?: string;
}

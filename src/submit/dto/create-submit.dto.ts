// dto/create-submit-ticket.dto.ts
import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateSubmitTicketDto {

  @IsString()
  @IsNotEmpty()
  admin_Id: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

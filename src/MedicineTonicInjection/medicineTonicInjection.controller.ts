import { Controller, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { MedicineTonicInjectionService } from "./medicineTonicInjection.service";

@Controller("medicine_tonic_injection")
export class MedicineTonicInjectionController {
  constructor(private readonly service: MedicineTonicInjectionService) {}

  @Post('create')
  async createCombined(@Body() body: any) {
    try {
      const result = await this.service.create(body);
      return result;
    } catch (error) {
      console.error("❌ Error creating medicine/tonic/injection with payment:", error);
      throw new HttpException(
        "Failed to create combined patient data",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

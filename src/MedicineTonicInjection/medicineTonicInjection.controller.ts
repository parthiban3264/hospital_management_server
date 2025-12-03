import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, Put, Delete } from "@nestjs/common";
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
  // ✅ Get all grouped by hospital
  @Get("all/:hospitalId")
  async getAllByHospital(@Param("hospitalId") hospital_Id: number) {
    try {
      return await this.service.getAllByHospital(Number(hospital_Id));
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      throw new HttpException("Failed to fetch data", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ✅ Update a specific record (medicine, tonic, or injection)
  @Put("update/:type/:id")
  async updateRecord(
    @Param("type") type: "medicine" | "tonic" | "injection",
    @Param("id") id: number,
    @Body() body: any
  ) {
    try {
      console.log('Updating record:', { type, id, body });
      return await this.service.updateRecord(type, Number(id), body);
    } catch (error) {
      console.error("❌ Error updating record:", error);
      throw new HttpException("Failed to update record", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ✅ Delete a specific record
  @Delete("delete/:type/:id")
  async deleteRecord(
    @Param("type") type: "medicine" | "tonic" | "injection",
    @Param("id") id: number
  ) {
    try {
      return await this.service.deleteRecord(type, Number(id));
    } catch (error) {
      console.error("❌ Error deleting record:", error);
      throw new HttpException("Failed to delete record", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}



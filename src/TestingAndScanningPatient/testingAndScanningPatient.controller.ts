import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UploadedFiles, BadRequestException, UseInterceptors } from "@nestjs/common";
import { TestingAndScanningPatientService } from "./testingAndScanningPatient.service";
import { extname, join } from "path";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from 'multer';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller("testing_and_scanning_patient")
export class TestingAndScanningPatientController {
  constructor(private readonly service: TestingAndScanningPatientService) {}

  @Post('create')
  create(@Body() data: any) {
    return this.service.create(data);
  }
//  @Post('create')
// @UseInterceptors(
//   FilesInterceptor('files', 6, {
//     storage: diskStorage({
//       destination: (req, file, callback) => {
//         const recordId = req.body.recordId;   // dynamic folder name

//         if (!recordId) {
//           return callback(new Error('Missing recordId'), '');
//         }

//         const uploadPath = join('/var/www/testing_scanning', recordId);

//         if (!fs.existsSync(uploadPath)) {
//           fs.mkdirSync(uploadPath, { recursive: true });
//         }

//         callback(null, uploadPath);
//       },

//       filename: (req, file, callback) => {
//         const uniqueName =
//           Date.now() + '-' + Math.round(Math.random() * 1e9);
//         const ext = extname(file.originalname);
//         callback(null, uniqueName + ext);
//       },
//     }),
//   }),
// )
// async createTestingScanning(
//   @UploadedFiles() files: Express.Multer.File[],
//   @Body() data: any,
// ) {
//   if (!data.recordId)
//     throw new BadRequestException('recordId is required');

//   if (!files || files.length === 0)
//     throw new BadRequestException('At least one file is required');

//   const imageUrls = files.map(
//     (file) =>
//       `https://hospitalservers.ramchintech.com/testing_scanning/${data.recordId}/${file.filename}`,
//   );

//   const payload = {
//     ...data,
//     images: imageUrls, // Save array of URLs
//   };

//   return this.service.create(payload);
// }


  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get('all/:hospital_Id/:type')
  findAllTestandScanByType(@Param('hospital_Id') hospital_Id: number, @Param('type') type: string) {
    return this.service.findAllTestAndScanByType(Number(hospital_Id), type);
  }
   @Get('all/:hospital_Id')
  findAllTestandScan(@Param('hospital_Id') hospital_Id: number) {
    return this.service.finfindAllTestandScan(Number(hospital_Id));
  }
  @Patch('update-payment-status/:paymentId')
  async updateTestingAndScanning(@Param('paymentId') paymentId: number) {
    try {
      const result = await this.service.updateTestingAndScanningByPayment(paymentId);
      return result;
    } catch (error) {
      console.error('Error updating testing & scanning records:', error);
      return {
        success: false,
        message: 'Failed to update testing & scanning records.',
        error: error.message,
      };
    }
  }

  @Get("getById/:id")
  findOne(@Param("id") id: number) {
    return this.service.findOne(+id);
  }

  @Patch("updateByIdTesting/:id")
  update(@Param("id") id: number, @Body() data: any) {
    return this.service.update(+id, data);
  }

  //================================================================================

  @Patch("updateByIdScanning/:id")
@UseInterceptors(
  FilesInterceptor("files", 6, {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const id = req.params.id;

        const uploadPath = join("/var/www/testing_scanning", id);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        callback(null, unique + extname(file.originalname));
      },
    }),
  })
)
async updateTestingScanning(
  @Param("id") id: number,
  @UploadedFiles() files: Express.Multer.File[],
  @Body() data: any
) {
  // If images uploaded, add to payload
  let imageUrls = [];

  if (files && files.length > 0) {
    imageUrls = files.map(
      (file) =>
        `https://hospitalservers.ramchintech.com/testing_scanning/${id}/${file.filename}`
    );
  }

  const payload = {
    ...data,
    ...(imageUrls.length > 0 && { images: imageUrls }) // only add if files exist
  };

  return this.service.update(+id, payload);
}
  //================================================================================

  @Delete("deleteById/:id")
  remove(@Param("id") id: number) {
    return this.service.remove(+id);
  }
}

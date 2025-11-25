
import { HospitalService } from "./hospital.service";

import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Delete,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';


@Controller("hospitals")
export class HospitalController {
  constructor(private readonly hospitalService: HospitalService) {}

  // Corrected create endpoint
  // @Post("create")
  // create(@Body() data: any) {
  //   const {id, name, address, photo, HospitalStatus, phone, mail,link } = data;
  //   console.log('hospital',data);
    
  //   return this.hospitalService.create({id, name, address, photo, HospitalStatus, phone, mail,link });
  // }

  @Get("all")
  findAll() {
    return this.hospitalService.findAll();
  }

  @Get("getById/:id/:patient_Id")
  findOne(@Param("id") id: string, @Param("patient_Id") patient_Id: string) {
    return this.hospitalService.findOne(+id,patient_Id);
  }

   @Get("getById/:id")
  findOneH(@Param("id") id: string) {
    return this.hospitalService.findOneH(+id);
  }

  // @Patch("updateById/:id")
  // update(@Param("id") id: string, @Body() data: any) {
  //   return this.hospitalService.update(+id, data);
  // }

  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.hospitalService.remove(+id);
  }

   @Post('create')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const hospitalId = req.body.hospitalId;
          if (!hospitalId) {
            return callback(new Error('Missing hospitalId'), '');
          }

          const uploadPath = join('/var/www/hospital_images', hospitalId);
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }

          callback(null, uploadPath);
        },
        filename: (req, file, callback) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, uniqueName + ext);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Body('hospitalId') id: number,
    @Body('name') name: string,
    @Body('address') address: string,
    @Body('HospitalStatus') HospitalStatus: string,
    @Body('phone') phone: string,
    @Body('mail') mail: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!id) throw new BadRequestException('hospitalId is required');

    const imageUrl = `https://hospitalservers.ramchintech.com/hospital_images/${id}/${file.filename}`;

 return this.hospitalService.create({id, name, address, imageUrl, HospitalStatus, phone, mail });

  }

 @Patch("updateById/:id")
@UseInterceptors(
  FileInterceptor("file", {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const hospitalId = req.params.id;

        const uploadPath = join("/var/www/hospital_images", hospitalId);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, uniqueName + ext);
      },
    }),
  })
)
async updateWithFile(
  @Param("id") id: string,
  @UploadedFile() file: any,
  @Body("name") name: string,
  @Body("address") address: string,
  @Body("HospitalStatus") HospitalStatus: string,
  @Body("phone") phone: string,
  @Body("mail") mail: string,
  @Body("oldImage") oldImage: string
) {
  let imageUrl = oldImage;

  // Replace image only if new file is uploaded
  if (file) {
    imageUrl = `https://hospitalservers.ramchintech.com/hospital_images/${id}/${file.filename}`;

    // Delete old image if exists
    if (oldImage) {
      const oldLocalPath = oldImage.replace(
        "https://hospitalservers.ramchintech.com",
        "/var/www"
      );

      if (fs.existsSync(oldLocalPath)) {
        fs.unlinkSync(oldLocalPath);
      }
    }
  }

  return this.hospitalService.update(+id, {
    name,
    address,
    HospitalStatus,
    phone,
    mail,
    imageUrl,
  });
}


}


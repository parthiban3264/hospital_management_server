
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
  @Post("create")
  create(@Body() data: any) {
    const {id, name, address, photo, HospitalStatus, phone, mail,link } = data;
    console.log('hospital',data);
    
    return this.hospitalService.create({id, name, address, photo, HospitalStatus, phone, mail,link });
  }

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

  @Patch("updateById/:id")
  update(@Param("id") id: string, @Body() data: any) {
    return this.hospitalService.update(+id, data);
  }

  @Delete("deleteById/:id")
  remove(@Param("id") id: string) {
    return this.hospitalService.remove(+id);
  }
   @Post('upload')
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
    @Body('hospitalId') hospitalId: string,
    @Body('name') name: string,
    @Body('address') address: string,
    @Body('HospitalStatus') HospitalStatus: string,
    @Body('phone') phone: string,
    @Body('mail') mail: string,
  ) {
    if (!file) throw new BadRequestException('File is required');
    if (!hospitalId) throw new BadRequestException('hospitalId is required');

    const imageUrl = `https://hospitalservers.ramchintech.com/hospital_images/${hospitalId}/${file.filename}`;


    // // Save to DB
    // await this.prisma.imageAndVideos.create({
    //   data: {
    //     school_id: parseInt(schoolId),
    //     link: imageUrl,
    //     type: 'IMAGE',
    //     title,
    //     description,
    //     date: parsedDate,
    //   },
    // });

    return { url: imageUrl };
  }

  // // 🔹 GET /upload/:schoolId (Fetch all images & videos)
  // @Get(':schoolId')
  // async getMediaBySchool(@Param('schoolId') schoolId: string) {
  //   const records = await this.prisma.imageAndVideos.findMany({
  //     where: { school_id: parseInt(schoolId) },
  //     orderBy: { date: 'desc' },
  //   });

  //   const images = records
  //     .filter((r) => r.type === 'IMAGE')
  //     .map((r) => ({
  //       id: r.id,
  //       link: r.link,
  //       title: r.title,
  //       description: r.description,
  //       date: r.date,
  //     }));

  //   const videos = records
  //     .filter((r) => r.type === 'VIDEO')
  //     .map((r) => ({
  //       id: r.id,
  //       link: r.link,
  //       title: r.title,
  //       description: r.description,
  //       date: r.date,
  //     }));

  //   return { images, videos };
  // }

  // 🔹 DELETE /upload/:schoolId/:filename (Delete image from FS & DB)
  @Delete(':schoolId/:filename')
  async deleteImage(
    @Param('schoolId') schoolId: string,
    @Param('filename') filename: string,
  ) {
    const filePath = join('/var/www/images', schoolId, filename);

    // Delete from filesystem if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // const imageUrl = https://smartschoolserver.ramchintech.com/images/${schoolId}/${filename};
    // await this.prisma.imageAndVideos.deleteMany({
    //   where: { link: imageUrl },
    // });

    return { message: 'Image deleted successfully' };
  }

  // // 🔹 DELETE /upload/video/:id
  // @Delete('video/:id')
  // async deleteVideo(@Param('id') id: string) {
  //   await this.prisma.imageAndVideos.delete({
  //     where: { id: parseInt(id) },
  //   });

  //   return { message: 'Video deleted successfully' };
  // }
}


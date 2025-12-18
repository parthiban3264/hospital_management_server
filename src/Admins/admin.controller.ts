import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { log } from 'console';

@Controller('admins')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // @Post("create")
  // create(@Body() data: any) {
  //   return this.adminService.create(data);
  // }

  @Post('create')
  async create(@Body() createPatientDto: any) {
    try {
      const result =
        await this.adminService.createAdminWithUser(createPatientDto);

      // 🔹 If user already exists, return proper error response
      if (!result.success) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.message, // e.g. "This phone number is already registered"
          data: null,
        };
      }

      // 🔹 Success response

      return {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Admin created successfully',
        data: result,
      };
    } catch (error) {
      console.error(error);

      // 🔹 Unexpected error response
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to create admin and user',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('all')
  findAll() {
    return this.adminService.findAll();
  }

  @Get('all/:hospital_Id/:role')
  async findAllByHospital(
    @Param('hospital_Id') hospital_Id: string,
    @Param('role') role: string,
  ) {
    return this.adminService.findAllByHospitalAndRole(
      Number(hospital_Id),
      role,
    );
  }

  @Get('all/:hospital_Id')
  async getAllByHospitalAdmin(@Param('hospital_Id') hospital_Id: string) {
    return this.adminService.findAllByHospitalAdmin(Number(hospital_Id));
  }
  @Patch('updateById/:id')
  update(@Param('id') id: string, @Body() data: any) {
    console.log('updateId', data, id);

    return this.adminService.update(+id, data);
  }
  // @Get("getById/:id")
  // findOne(@Param("id") id: string) {
  //   return this.adminService.findOne(+id);
  // }
  @Get('getByUser/:hospitalId/:userId')
  async findByUser(
    @Param('hospitalId') hospitalId: string,
    @Param('userId') userId: string,
  ) {
    const admin = await this.adminService.findByUser(hospitalId, userId);
    if (!admin) {
      throw new NotFoundException(
        `Admin with hospitalId ${hospitalId} and userId ${userId} not found`,
      );
    }
    return { status: 'success', data: admin };
  }

  @Get('check-user-id/:hospital_Id/:userId')
  async checkUserId(
    @Param('hospital_Id') hospital_Id: string,
    @Param('userId') userId: string,
  ) {
    const exists = await this.adminService.checkUserIdExists(
      Number(hospital_Id),
      userId,
    );
    return { exists };
  }

  @Patch('update/:hospital_Id/:user_Id')
  updateByHospitalAndUser(
    @Param('hospital_Id') hospital_Id: string,
    @Param('user_Id') user_Id: string,
    @Body() data: any,
  ) {
    return this.adminService.updateByAdmin(+hospital_Id, user_Id, data);
  }

  //  @Post('upload_photo/:hospital_Id/:user_Id')
  // @UseInterceptors(
  //   FileInterceptor('photo', {
  //     storage: diskStorage({
  //       destination: './uploads/admins',
  //       filename: (req, file, cb) => {
  //         const uniqueName =
  //           Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         cb(null, uniqueName + extname(file.originalname));
  //       },
  //     }),
  //     fileFilter: (req, file, cb) => {
  //       if (!file.mimetype.startsWith('image/')) {
  //         cb(new Error('Only image files allowed'), false);
  //       }
  //       cb(null, true);
  //     },
  //   }),
  // )
  // async uploadAdminPhoto(
  //   @Param('hospital_Id') hospital_Id: string,
  //   @Param('user_Id') user_Id: string,
  //   @UploadedFile() file: Express.Multer.File,
  // ) {
  //   log('Upload request received for admin:', file);
  //   if (!file) {
  //     return { status: 'failed', message: 'No image uploaded' };
  //   }

  //   return this.adminService.saveAdminPhoto(
  //     +hospital_Id,
  //     user_Id,
  //     file.filename,
  //   );
  // }

  // @Patch('updateProfilePhoto/:hospital_Id/:user_Id')
  // @UseInterceptors(
  //   FileInterceptor('photo', {
  //     storage: diskStorage({
  //       destination: (req, file, cb) => {
  //         const { user_Id } = req.params;
  //         const uploadPath = join('/var/www/profile_images', user_Id);

  //         if (!fs.existsSync(uploadPath)) {
  //           fs.mkdirSync(uploadPath, { recursive: true });
  //         }

  //         cb(null, uploadPath);
  //       },
  //       filename: (req, file, cb) => {
  //         // Overwrite previous image by using a fixed name
  //         cb(null, 'profile' + extname(file.originalname));
  //       },
  //     }),
  //     fileFilter: (req, file, cb) => {
  //       if (!file.mimetype.startsWith('image/')) {
  //         cb(new Error('Only image files allowed'), false);
  //       } else {
  //         cb(null, true);
  //       }
  //     },
  //   }),
  // )
//   @Patch('updateProfilePhoto/:hospital_Id/:user_Id')
// @UseInterceptors(FileInterceptor('photo', {
//   storage: diskStorage({
//     destination: (req, file, cb) => {
//       console.log('DESTINATION PARAMS:', req.params);

//       const { user_Id } = req.params;
//       const uploadPath = join('/var/www/profile_images', user_Id);

//       console.log('UPLOAD PATH:', uploadPath);

//       if (!fs.existsSync(uploadPath)) {
//         fs.mkdirSync(uploadPath, { recursive: true });
//       }

//       cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//       console.log('FILE INFO:', file);
//       cb(null, 'profile' + extname(file.originalname));
//     },
//   }),
// }))
// async updateProfilePhoto(
//   @Param('hospital_Id') hospital_Id: string,
//   @Param('user_Id') user_Id: string,
//   @UploadedFile() file: Express.Multer.File,
// ) {
//   console.log('CONTROLLER FILE:', file);

//   if (!file) {
//     throw new BadRequestException('No image uploaded');
//   }

//   const finalUrl =
//     `https://hospitalservers.ramchintech.com/profile_images/${user_Id}/${file.filename}`;

//   const result = await this.adminService.saveAdminPhoto(
//     +hospital_Id,
//     user_Id,
//     finalUrl,
//   );

//   return { status: 'success', photo: finalUrl, data: result.data };
// }


@Put('updateProfilePhoto/:hospital_Id/:user_Id')
@UseInterceptors(
  FileInterceptor('photo', {
    limits: { fileSize: 5 * 1024 * 1024 },
    storage: diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = join('/var/www/profile_images', req.params.user_Id);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        // 🔥 Delete old profile image before saving new one
        const oldImagePath = join(uploadPath, 'profile.jpg');
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }

        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        cb(null, 'profile.jpg'); // overwrite-safe
      },
    }),
  }),
)
async updateProfilePhoto(
  @Param('hospital_Id') hospital_Id: string,
  @Param('user_Id') user_Id: string,
  @UploadedFile() file: Express.Multer.File,
) {
  if (!file) {
    throw new BadRequestException('No image uploaded');
  }

  const finalUrl =
    `https://hospitalservers.ramchintech.com/profile_images/${user_Id}/profile.jpg`;

  await this.adminService.saveAdminPhoto(
    +hospital_Id,
    user_Id,
    finalUrl,
  );

  return {
    status: 'success',
    photo: finalUrl,
  };
}


  @Delete('deleteById/:id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(+id);
  }
}

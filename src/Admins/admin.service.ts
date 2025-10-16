import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

   async createAdminWithUser(data: any) {
      // const defaultPassword = `${data.designation}_${data.hospital_Id}`; // e.g., "Doctor_12"
      const defaultPassword = `abc123`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
      // Optionally wrap in a transaction for safety
      const [user, admin] = await this.prisma.$transaction([
        this.prisma.user.create({
          data: {
            hospital_Id: data.hospital_Id,
            user_Id: data.user_Id,
            password: hashedPassword,
            role:data.role,
          },
        }),
        this.prisma.admin.create({
       data: {
        hospital_Id: data.hospital_Id,
        user_Id: data.phone,         
        name: data.name,
        designation: data.designation,
        phone: data.phone,
        email: data.email,
        role: data.role,
        specialist: data.specialist,
        address: data.address,
        photo: data.photo,
        status: data.status,
        gender: data.gender,
      },
    }),
      ]);
       return { user, admin, defaultPassword };
  }


// async create(data: any) {
//   try {
//     const admin = await this.prisma.admin.create({
//       data: {
//         hospital_Id: data.hospital_Id, // must exist in Hospital table
//         user_Id: data.user_Id,         // must exist in User table
//         name: data.name,
//         designation: data.designation,
//         phone: data.phone,
//         email: data.email,
//         address: data.address,
//         photo: data.photo,
//         status: data.status,
//         gender: data.gender,
//       },
//     });

//     return {
//       status: "success",
//       message: "Admin created successfully",
//       data: admin,
//     };
//   } catch (error) {
//     return {
//       status: "failed",
//       error: error.message,
//     };
//   }
// }


  async findAll() {
    return this.prisma.admin.findMany({
      include: { Hospital: true, User: true },
    });
  }

  async findAllByHospitalAndRole(hospital_Id: number, designation: string) {
    return this.prisma.admin.findMany({
      where: { hospital_Id, designation },
      include: { Hospital: true, User: true },
    });
  }

  // async findOne(id: number) {
  //   return this.prisma.admin.findUnique({
  //     where: { id },
  //     include: { Hospital: true, User: true },
  //   });
  // }
  async findByUser(hospitalId: string, userId: string) {
    return this.prisma.admin.findUnique({
      where: {
        hospital_Id_user_Id: {
          hospital_Id: parseInt(hospitalId, 10),
          user_Id: userId,
        },
      },
      include: { Hospital: true, User: true },
    });
  }

  // async update(id: number, data: any) {
  //   try {
  //     const admin = await this.prisma.admin.update({
  //       where: { id },
  //       data,
  //     });
  //     return { status: "success", data: admin };
  //   } catch (error) {
  //     return { status: "failed", error: error.message };
  //   }
  // }

  async updateByAdmin(hospital_Id: number, user_Id: string, data: any) {
    try {
      const admin = await this.prisma.admin.update({
        where: {
          hospital_Id_user_Id: {
            hospital_Id,
            user_Id,
          },
        },
        data,
        include: {
          Hospital: true,
        },
      });

      return { status: "success", data: admin };
    } catch (error) {
      console.error("Update Error:", error);
      return { status: "failed", message: error.message };
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.admin.delete({ where: { id } });
      return { status: "success", message: "Admin deleted" };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

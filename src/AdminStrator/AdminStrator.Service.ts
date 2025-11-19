// import { Injectable, NotFoundException } from "@nestjs/common";
// import { PrismaService } from "src/prisma/prisma.service";

// @Injectable()
// export class AdminStratorService {
//   constructor(private prisma: PrismaService) {}

//   async create(data: any) {
//     try {
//       const adminStrator = await this.prisma.adminStrator.create({
//         data: {
//           user_Id: data.user_Id,
//           name: data.name,
//           status: data.status,
//           designation: data.designation,
//           phone: data.phone,
//           email: data.email,
//           photo: data.photo,
//           address: data.address,
//           gender: data.gender,
//         },
//       });
//       return { status: "success", message: "AdminStrator created", data: adminStrator };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async findAll() {
//     const admins = await this.prisma.adminStrator.findMany({
//       include: { User: true },
//     });
//     return { status: "success", message: "AdminStrators fetched", data: admins };
//   }

//   async findOne(id: number) {
//     const admin = await this.prisma.adminStrator.findUnique({
//       where: { id },
//       include: { User: true },
//     });

//     if (!admin) throw new NotFoundException(`AdminStrator with ID ${id} not found`);

//     return { status: "success", message: "AdminStrator fetched", data: admin };
//   }

//   async update(id: number, data: any) {
//     try {
//       const admin = await this.prisma.adminStrator.update({
//         where: { id },
//         data,
//       });
//       return { status: "success", message: "AdminStrator updated", data: admin };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async remove(id: number) {
//     try {
//       const admin = await this.prisma.adminStrator.delete({ where: { id } });
//       return { status: "success", message: "AdminStrator deleted", data: admin };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminStratorService {
  constructor(private prisma: PrismaService) {}

  // Create admin linked to a User
  async create(data: any) {
    const defaultPassword = `abc123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const user_Id = data.phone.replace(/^(\+?91[\s-]*)?/, '').trim();

    const result = await this.prisma.$transaction(async (tx) => {
      // 1️⃣ Create User
      const user = await tx.user.create({
        data: {
          hospital_Id: data.hospital_Id,
          user_Id: user_Id,
          password: hashedPassword,
          role: 'ADMINISTRATOR',
        },
      });
      const adminStrator = await tx.adminStrator.create({
        data: {
          user_Id: user_Id, // link to existing User
          name: data.name,
          status: data.status,
          designation: data.designation,
          phone: data.phone,
          role: data.role,
          email: data.email,
          photo: data.photo,
          address: data.address,
          gender: data.gender,
        },
      });
      return { user, adminStrator };
    });
    // Return result along with default password
    return { ...result, defaultPassword };
  }

  // Fetch all admins with their User info
  async findAll() {
    const admins = await this.prisma.adminStrator.findMany({
      include: { User: true },
    });
    return {
      status: 'success',
      message: 'AdminStrators fetched',
      data: admins,
    };
  }

  // Fetch a single admin by user_Id instead of id
  async findOneByUserId(Id: number) {
    const admin = await this.prisma.adminStrator.findUnique({
      where: { id: Id },
      include: { User: true },
    });

    if (!admin)
      throw new NotFoundException(`AdminStrator with user_Id ${Id} not found`);

    return { status: 'success', message: 'AdminStrator fetched', data: admin };
  }

  // Update admin by user_Id
  async updateByUserId(Id: number, data: any) {
    try {
      const admin = await this.prisma.adminStrator.update({
        where: { id: Id }, // update via user_Id
        data,
      });
      return {
        status: 'success',
        message: 'AdminStrator updated',
        data: admin,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  // Remove admin by user_Id
  async removeByUserId(Id: number) {
    try {
      const admin = await this.prisma.adminStrator.delete({
        where: { id: Id },
      });
      return {
        status: 'success',
        message: 'AdminStrator deleted',
        data: admin,
      };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }
}

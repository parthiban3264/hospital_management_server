import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { log } from 'console';
import e from 'express';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createAdminWithUser(data: any) {
    const defaultPassword = `abc123`;
    const hashedPassword = await bcrypt.hash(data.password, 10);

    let user_Id;

    if (!data.user_Id || data.user_Id.trim() === '') {
      // user_Id is empty → use phone (remove +91)
      user_Id = data.phone.replace(/^(\+?91[\s-]*)?/, '').trim();
    } else {
      // user_Id has value → use it
      user_Id = data.user_Id;
    }

    console.log('User ID:', user_Id, 'Phone:', data.phone);

    let permissions: number[] = [];

    const role = data.role?.toString().toUpperCase();

    const rolePermissionMap: Record<string, number[]> = {
      DOCTOR: [6, 8],

      NURSE: [1, 2, 14, 15],

      CASHIER: [12],

      'LAB TECHNICIAN': [3, 4, 7, 9, 10, 11, 16, 17],

      'MEDICAL STAFF': [5],
    };

    // ❌ Do NOT assign permissions to Admin / Super Admin
    if (role !== 'ADMIN') {
      permissions = rolePermissionMap[role] ?? [];
    }

    try {
      // 👉 Step 1: Check if user exists in SAME hospital
      const existingUser = await this.prisma.user.findFirst({
        where: {
          user_Id: user_Id,
          hospital_Id: data.hospital_Id,
        },
      });

      if (existingUser) {
        return {
          success: false,
          message:
            'User already exists in this hospital. Please use another phone number.',
        };
      }

      // 👉 Step 2: Create user + admin inside a transaction
      const [user, admin] = await this.prisma.$transaction([
        this.prisma.user.create({
          data: {
            hospital_Id: data.hospital_Id,
            user_Id: user_Id,
            password: hashedPassword,
            role: data.role,
          },
        }),

        this.prisma.admin.create({
          data: {
            hospital_Id: data.hospital_Id,
            user_Id: user_Id,
            name: data.name,
            designation: data.designation,
            phone: data.phone,
            email: data.email,
            role: data.role,
            assignDoctorId: data.assignDoctorId,
            permissions: permissions,
            doctorAmount: data.doctorAmount || 0,
            specialist: data.specialist,
            address: data.address,
            photo: data.photo,
            status: data.status,
            gender: data.gender,
          },
        }),
      ]);

      return { success: true, user, admin, defaultPassword };
    } catch (error: any) {
      // 👉 Prisma unique constraint error
      if (error.code === 'P2002') {
        return {
          success: false,
          message:
            'This phone number is already registered. Please use another.',
        };
      }

      // 👉 Other errors
      return {
        success: false,
        message: 'Failed to create user. Please try again.',
        details: error.message,
      };
    }
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

  // async findAllByHospitalAndRole(hospital_Id: number, role: string) {

  //   return this.prisma.admin.findMany({
  //     where: { hospital_Id, role},
  //     include: { Hospital: true, User: true },
  //   });
  // }
  async findAllByHospitalAndRole(hospital_Id: number, roles: string[]) {
    return this.prisma.admin.findMany({
      where: {
        hospital_Id,
        OR: [
          // Doctor → always allowed
          {
            role: 'DOCTOR',
          },

          // Admin → only if accessDoctorRole = true
          {
            role: 'ADMIN',
            accessDoctorRole: true,
          },
        ],
      },
      include: {
        Hospital: true,
        User: true,
      },
    });
  }

  async findAllByHospitalAdmin(hospital_Id: number) {
    return this.prisma.admin.findMany({
      where: { hospital_Id },
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

  async checkUserIdExists(
    hospital_Id: number,
    userId: string,
  ): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({
      where: {
        hospital_Id_user_Id: {
          hospital_Id,
          user_Id: userId,
        },
      },
      select: { id: true }, // minimal payload
    });

    return !!admin;
  }

  async update(id: number, data: any) {
    console.log('data', data);

    try {
      const admin = await this.prisma.admin.update({
        where: { id },
        data: {
          status: data.status,
          doctorAmount: data.amount,
          permissions: data.permissions,
          assignDoctorId: data.assignDoctorId,
          accessDoctorRole: data.accessDoctorRole,
          accessAdminRole: data.accessAdminRole,
          inPatientAmount: data.inPatientAmount,
          isFirstLogin:data.isFirstLogin,
        },
      });
      log('Updated Admin:', admin);
      return { status: 'success', data: admin };
    } catch (error) {
      console.error('Update Error:', error);
      return { status: 'failed', error: error.message };
    }
  }

   async updateIsFirstLogin(id: number, data: any) {
      try {
        log('id',id ,data)
        let updateData = { ...data };
        const user = await this.prisma.admin.update({
          where: { id },
          data: updateData,
        });
        log('user',user)
        return { status: 'success', data: user };
      } catch (error) {
        return { status: 'failed', error: error.message };
      }
    }

  async updateByAdmin(hospital_Id: number, user_Id: string, data: any) {
    log('updateByAdmin data', data);
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

      return { status: 'success', data: admin };
    } catch (error) {
      console.error('Update Error:', error);
      return { status: 'failed', message: error.message };
    }
  }

  async saveAdminPhoto(hospital_Id: number, user_Id: string, filename: string) {
    try {
      const photoUrl = filename; // the file path or URL
      const admin = await this.prisma.admin.update({
        where: {
          hospital_Id_user_Id: {
            // composite unique key
            hospital_Id,
            user_Id,
          },
        },
        data: { photo: photoUrl },
      });

      return {
        status: 'success',
        photo: photoUrl, // returned to Flutter
        data: admin,
      };
    } catch (error) {
      console.error('Upload Error:', error);
      return {
        status: 'failed',
        message: 'Failed to upload profile image',
      };
    }
  }

  // async remove(id: number) {
  //   try {
  //     await this.prisma.admin.delete({ where: { id },include:{
  //       User:{
  //         await this.prisma.admin.delete({ where: { user_Id:id }})
  //       }
  //     } });
  //     return { status: 'success', message: 'Admin deleted' };
  //   } catch (error) {
  //     return { status: 'failed', error: error.message };
  //   }
  // }

  async remove(id: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1️⃣ Find admin to get user_Id
        const admin = await tx.admin.findUnique({
          where: { id },
          select: {
            User: { select: { id: true } }, // get user primary key
          },
        });

        if (!admin) {
          throw new Error('Admin not found');
        }

        // 2️⃣ Delete admin
        await tx.admin.delete({
          where: { id },
        });

        // 3️⃣ Delete related user
        await tx.user.delete({
          where: { id: admin.User.id }, // ✅ use primary key
        });
      });

      return { status: 'success', message: 'Admin deleted successfully' };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  // 🔹 New method: fetch permissions IDs + keys
  // async getStaffPermissions(hospitalId: number, userId: string) {
  //   // Find the staff/admin
  //   const staff = await this.prisma.admin.findUnique({
  //     where: { userId },
  //     select: { id: true, role: true, permissions: true },
  //   });

  //   if (!staff) return null;

  //   // If ADMIN role, return all permission IDs + keys
  //   if (staff.role.toUpperCase() === 'ADMIN') {
  //     const allPermissions = await this.prisma.ButtonPermission.findMany({
  //       select: { id: true, key: true },
  //     });
  //     return allPermissions;
  //   }

  //   // Medical Staff → fetch only permissions assigned in array
  //   if (staff.permissions && Array.isArray(staff.permissions)) {
  //     const permissions = await this.prisma.ButtonPermission.findMany({
  //       where: { id: { in: staff.permissions } },
  //       select: { id: true, key: true },
  //     });
  //     return permissions;
  //   }

  //   return [];
  // }
}

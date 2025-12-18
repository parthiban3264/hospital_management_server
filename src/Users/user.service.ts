// import { Injectable } from "@nestjs/common";
// import { PrismaService } from "src/prisma/prisma.service";
// import * as bcrypt from "bcrypt";

// @Injectable()
// export class UserService {
//   constructor(private prisma: PrismaService) {}

//   async create(data: any) {
//     try {
//       // hash the password before saving
//       const hashedPassword = await bcrypt.hash(data.password, 10);

//       const user = await this.prisma.user.create({
//         data: {
//           ...data,
//           password: hashedPassword,
//         },
//       });

//       return { status: "success", data: user };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async findAll() {
//     return this.prisma.user.findMany();
//   }

//   async findOne(id: number) {
//   return this.prisma.user.findUnique({ where: { id } });
// }

//   async update(id: number, data: any) {
//     try {
//       let updateData = { ...data };

//       // if password is being updated, hash it again
//       if (data.password) {
//         updateData.password = await bcrypt.hash(data.password, 10);
//       }

//       const user = await this.prisma.user.update({
//         where: { id },
//         data: updateData,
//       });

//       return { status: "success", data: user };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }

//   async remove(id: number) {
//     try {
//       await this.prisma.user.delete({ where: { id } });
//       return { status: "success", message: "User deleted" };
//     } catch (error) {
//       return { status: "failed", error: error.message };
//     }
//   }
// }

import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { log } from 'console';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async create(data: any) {
    console.log(typeof data.user_Id);

    try {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      console.log(hashedPassword);

      const user = await this.prisma.user.create({
        data: {
          ...data,
          user_Id: data.user_Id.toString(), // ✅ convert to string
          password: hashedPassword,
        },
      });
      return { status: 'success', data: user };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: number, data: any) {
    try {
      let updateData = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
      return { status: 'success', data: user };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { status: 'success', message: 'User deleted' };
    } catch (error) {
      return { status: 'failed', error: error.message };
    }
  }

  // -------------------- LOGIN --------------------

  // async login(data: any) {
  //   const { hospital_Id, user_Id, password } = data;

  //   const user = await this.prisma.user.findFirst({
  //     where: { hospital_Id, user_Id },
  //     include: { Admin: true },
  //   });

  //   if (!user) {
  //     throw new UnauthorizedException("User not found");
  //   }

  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) {
  //     throw new UnauthorizedException("Invalid password");
  //   }

  //   const payload = {
  //     sub: user.id,
  //     role: user.role,
  //     hospitalId: user.hospital_Id,
  //     userId: user.user_Id,
  //   };

  //   return {
  //     access_token: this.jwtService.sign(payload),
  //   };
  // }

//   async login(data: any) {
//     const { hospital_Id, user_Id, password } = data;

//     const user = await this.prisma.user.findFirst({
//       where: { hospital_Id, user_Id },
//       include: { Admin: true, Hospital: true }, // 👈 includes Admin relation
//     });

//     if (!user) {
//       throw new UnauthorizedException('User not found');
//     }
//    if (user.isLoggedIn) {
//       throw new UnauthorizedException('User already logged in elsewhere');
//     }
//     if (user.Hospital.HospitalStatus !== 'ACTIVE') {
//       throw new UnauthorizedException('Hospital is not active');
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       throw new UnauthorizedException('Invalid password');
//     }
// //  // ✅ Set user as logged in
// //   await this.prisma.user.update({
// //     where: { id: user.id },
// //     data: { isLoggedIn: true },
// //   });

//     const payload = {
//       sub: user.id,
//       role: user.role,
//       hospitalId: user.hospital_Id,
//       userId: user.user_Id,
//     };

//     const token = this.jwtService.sign(payload);

//     await this.prisma.user.update({
//     where: { id: user.id },
//     data: {
//       isLoggedIn: true,
//       sessionToken: token,
//     },
//   });

//     // ✅ Flatten Admin relation for convenience
//     const adminData = user.Admin?.[0]
//       ? { designation: user.Admin[0].designation }
//       : null;

//     // ✅ Remove password before sending user info
//     const { password: _, ...safeUser } = user;

//     return {
//       success: true,
//       data: {
//         access_token: token,
//         user: {
//           ...safeUser,
//           admin: adminData, // 👈 what Flutter will read as user["admin"]["designation"]
//         },
//       },
//     };
//   }
async login(data: any) {
  const { hospital_Id, user_Id, password, device_Id } = data;

  const user = await this.prisma.user.findFirst({
    where: { hospital_Id, user_Id },
    include: { Admin: true, Hospital: true },
  });

  if (!user) throw new UnauthorizedException("User not found");

  // ------------------------------------
  // 1️⃣ CHECK IF SESSION EXISTS
  // ------------------------------------
  if (user.sessionToken && user.device_Id) {
    const decoded = this.jwtService.decode(user.sessionToken) as any;
    const now = Math.floor(Date.now() / 1000);

    const isTokenValid = decoded?.exp && decoded.exp > now;

    // Check if another device is using the session
    if (isTokenValid && user.device_Id !== device_Id) {
      throw new UnauthorizedException(
        "User already logged in on another device"
      );
    }

    // If token expired → reset session
    if (!isTokenValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isLoggedIn: false,
          sessionToken: null,
          device_Id: null,
        },
      });
      console.log("Expired session auto-reset ✔");
    }
  }

  // ------------------------------------
  // 2️⃣ CHECK PASSWORD
  // ------------------------------------
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new UnauthorizedException("Invalid password");

  // ------------------------------------
  // 3️⃣ GENERATE NEW TOKEN
  // ------------------------------------
  const payload = {
    sub: user.id,
    role: user.role,
    hospitalId: user.hospital_Id,
    userId: user.user_Id,
  };

  const newToken = this.jwtService.sign(payload, {
    expiresIn: "1d",
  });

  // ------------------------------------
  // 4️⃣ SAVE NEW SESSION WITH DEVICE ID
  // ------------------------------------
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      isLoggedIn: true,
      sessionToken: newToken,
      device_Id: device_Id, // Save current device
    },
  });

  const adminData = user.Admin?.[0]
    ? { designation: user.Admin[0].designation }
    : null;

  const { password: _, ...safeUser } = user;

  return {
    success: true,
    data: {
      access_token: newToken,
      user: {
        ...safeUser,
        admin: adminData,
      },
    },
  };
}



  // user.service.ts
// user.service.ts
// async logout(userId: string) {
//   // first, find the numeric ID from user_Id
//   const user = await this.prisma.user.findFirst({
//     where: { user_Id: userId },
//   });

//   if (!user) {
//     throw new Error('User not found');
//   }

//   await this.prisma.user.update({
//     where: { id: user.id }, // ✅ numeric PK is unique
//     data: { isLoggedIn: false },
//   });

//   return { success: true, message: 'Logged out successfully' };
// }

 async logout(userId: string,hospital_Id:number) {
  log('Logging out userId:', userId);
    const user = await this.prisma.user.findFirst({ where: { user_Id: userId, hospital_Id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isLoggedIn: false, sessionToken: null },
    });

    return { success: true, message: 'Logged out successfully' };
  }



  //================================================NEW LOGIN===================================================

//   async login(data: any) {
//   const { hospital_Id, user_Id, password } = data;

//   const user = await this.prisma.user.findFirst({
//     where: { hospital_Id, user_Id },
//     include: { Admin: true, Hospital: true },
//   });

//   if (!user) throw new UnauthorizedException('User not found');

//   if (user.Hospital.HospitalStatus !== 'ACTIVE') {
//     throw new UnauthorizedException('Hospital is not active');
//   }

//   const isPasswordValid = await bcrypt.compare(password, user.password);
//   if (!isPasswordValid) {
//     throw new UnauthorizedException('Invalid password');
//   }

//   // 👇 if user is already logged in
//   if (user.sessionToken) {
//     return {
//       success: true,
//       alreadyLoggedIn: true,   // 👈 Flutter will show popup
//       message: "Already logged in on another device",
//     };
//   }

//   // 👇 normal login
//   const newSessionToken = crypto.randomUUID();

//   await this.prisma.user.update({
//     where: { id: user.id },
//     data: { sessionToken: newSessionToken },
//   });

//   const payload = {
//     sub: user.id,
//     role: user.role,
//     hospitalId: user.hospital_Id,
//     userId: user.user_Id,
//     sessionToken: newSessionToken,
//   };

//   const token = this.jwtService.sign(payload);

//   const adminData = user.Admin?.[0]
//     ? { designation: user.Admin[0].designation }
//     : null;

//   const { password: _, ...safeUser } = user;

//   return {
//     success: true,
//     alreadyLoggedIn: false,
//     data: {
//       access_token: token,
//       session_token: newSessionToken,
//       user: { ...safeUser, admin: adminData },
//     },
//   };
// }

// async forceLogout(data: any) {
//     const { hospital_Id, user_Id } = data;

//     await this.prisma.user.updateMany({
//       where: {
//         hospital_Id: Number(hospital_Id),
//         user_Id: user_Id,
//       },
//       data: {
//         sessionToken: null, // removes old login device
//       },
//     });

//     return {
//       success: true,
//       message: "Old device session cleared successfully",
//     };
//   }

// ---------------------------
  // VERIFY OLD PASSWORD
  // ---------------------------
  async verifyOldPassword(id: number, oldPassword: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('Admin not found');

     const result =  await bcrypt.compare(oldPassword, user.password);
     log('Password verification result:', result);
     return result;
  }

  // ---------------------------
  // UPDATE PASSWORD
  // ---------------------------
  async updatePassword(id: number, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) throw new NotFoundException('user not found');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return {
    success: true,               // ✅ add this
    message: 'Password updated successfully',
    userId: id,
  };
  }



async getByUserId(userId: string, hospital_Id: number) {
    console.log('🔍 Searching for user:', userId, 'hospital:', hospital_Id);

    const user = await this.prisma.user.findFirst({
      where: { user_Id: userId, hospital_Id },
      select: { id: true },
    });

    console.log('Result from DB:', user);

    if (!user) {
      throw new NotFoundException(`User with userId ${userId} not found`);
    }

    // ✅ wrap in `data` for consistent frontend parsing
    return { data: user };
  }


}

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

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async create(data: any) {
    console.log(typeof(data.user_Id));
    
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    console.log(hashedPassword);
    
    const user = await this.prisma.user.create({
      data: {
        ...data,
        user_Id: (data.user_Id.toString()), // ✅ convert to string
        password: hashedPassword,
      },
    });
    return { status: "success", data: user };
  } catch (error) {
    return { status: "failed", error: error.message };
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
      return { status: "success", data: user };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { status: "success", message: "User deleted" };
    } catch (error) {
      return { status: "failed", error: error.message };
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
  async login(data: any) {
  const { hospital_Id, user_Id, password } = data;

  const user = await this.prisma.user.findFirst({
    where: { hospital_Id, user_Id,role:{
      not: 'PATIENT'
    } },
    include: { Admin: true,Hospital:true }, // 👈 includes Admin relation

  });

  if (!user) {
    throw new UnauthorizedException("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException("Invalid password");
  }

  const payload = {
    sub: user.id,
    role: user.role,
    hospitalId: user.hospital_Id,
    userId: user.user_Id,
  };

  const token = this.jwtService.sign(payload);

  // ✅ Flatten Admin relation for convenience
  const adminData = user.Admin?.[0]
    ? { designation: user.Admin[0].designation }
    : null;

  // ✅ Remove password before sending user info
  const { password: _, ...safeUser } = user;

  return {
    success: true,
    data: {
      access_token: token,
      user: {
        ...safeUser,
        admin: adminData, // 👈 what Flutter will read as user["admin"]["designation"]
      },
    },
  };
}

}

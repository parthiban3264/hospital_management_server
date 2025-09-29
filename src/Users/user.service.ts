import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      // hash the password before saving
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...data,
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

      // if password is being updated, hash it again
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
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class RoomsAvailableService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    try {
      const room = await this.prisma.roomsAvailable.create({
        data: {
          hospital_Id: data.hospital_Id,
          staff_Id: data.staff_Id,
          roomNo: data.roomNo,
          capacity: data.capacity,
          notes: data.notes,
          type: data.type,
          amount: data.amount,
        },
      });
      return { status: "success", message: "Room created", data: room };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async findAll() {
    const rooms = await this.prisma.roomsAvailable.findMany({
      include: { Hospital: true },
    });
    return { status: "success", message: "Rooms fetched", data: rooms };
  }

  async findOne(id: number) {
    const room = await this.prisma.roomsAvailable.findUnique({
      where: { id },
      include: { Hospital: true },
    });
    if (!room) throw new NotFoundException(`Room with ID ${id} not found`);
    return { status: "success", message: "Room fetched", data: room };
  }

  async update(id: number, data: any) {
    try {
      const room = await this.prisma.roomsAvailable.update({
        where: { id },
        data,
      });
      return { status: "success", message: "Room updated", data: room };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }

  async remove(id: number) {
    try {
      const room = await this.prisma.roomsAvailable.delete({
        where: { id },
      });
      return { status: "success", message: "Room deleted", data: room };
    } catch (error) {
      return { status: "failed", error: error.message };
    }
  }
}

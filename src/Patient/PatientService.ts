import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
  const patient = await this.prisma.patient.create({
    data: {
      ...data,
      hospital_Id: data.hospital_Id, // must exist
      user_Id: data.user_Id,         // must exist
    },
  });

  return {
    status: 'success',
    message: 'Patient created successfully',
    data: patient,
  };
}


  async findAll() {
    const patients = await this.prisma.patient.findMany({
      include: {
        Hospital: true,
        User: true,
      },
    });

    return {
      status: 'success',
      message: 'Patients fetched successfully',
      data: patients,
    };
  }

  async findOne(id: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        Consultation: true,
        Treatment: true,
        Payments: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return {
      status: 'success',
      message: 'Patient fetched successfully',
      data: patient,
    };
  }

  async update(id: number, data: any) {
    const patient = await this.prisma.patient.update({
      where: { id },
      data,
    });

    return {
      status: 'success',
      message: 'Patient updated successfully',
      data: patient,
    };
  }

  async delete(id: number) {
    const patient = await this.prisma.patient.delete({
      where: { id },
    });

    return {
      status: 'success',
      message: 'Patient deleted successfully',
      data: patient,
    };
  }
}

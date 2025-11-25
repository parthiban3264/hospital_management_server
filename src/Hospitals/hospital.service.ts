import { Injectable } from "@nestjs/common";
import { log } from "console";
import e from "express";
import { stat } from "fs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class HospitalService {
  constructor(private prisma: PrismaService) {}

 async create(data: any) {
  try {
    // Valida
    // te ID
   
    if (!data.hospitalId) {
  
      return { error: "Hospital ID is required",hospitalId:hospitalId, status: "failed" };
    }
 const hospitalId = Number(data.hospitalId);
    if (isNaN(hospitalId)) {
      return { error: "Hospital ID must be a number", status: "failed" };
    }
    // Check duplicate
    const exists = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (exists) {
      return { error: "Hospital ID already exists", status: "failed" };
    }

    // Create new hospital
    const hospital = await this.prisma.hospital.create({
      data: {
       id: Number(hospitalId),
        name: data.name,
        address: data.address,  
        HospitalStatus: data.HospitalStatus,
        phone: data.phone,
        mail: data.mail,
        photo: data.imageUrl,

      },
    });

    return { data: hospital, status: "success" };
  } catch (error) {
    console.log(error.message);
    
    return { error: error.message, status: "failed" };
  }
}


  async findAll() {
    try {
      const hospitals = await this.prisma.hospital.findMany({
      include: {
          Admins: {
          select: {
            id: true,
            user_Id: true,
            name: true,
            designation: true,
            role: true,
            status: true,
          }
        }
      }
      });
      return { data: hospitals, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }

 async findOne(id: number, patient_Id: string) {
  try {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        Patients: {
          where: { user_Id: patient_Id }   // match patient
        },

        Admins: {
          select: {
            id: true,
            name: true,
            user_Id: true,
            designation: true,
            role: true,
            status: true,
          },
        },

        Consultation: {
          where: { patient_Id: patient_Id }  // match patient
        },

        TestingAndScannings: {
          where: { patient_Id: patient_Id }  // match patient
        },

        Payments: {
          where: { patient_Id: patient_Id }  // match patient
        },

        MedicinePatients: {
          where: { patient_Id: patient_Id },  // match patient
          include:{
            Medician: true,
          }
          
        },

        InjectionPatients: {
          where: { patient_Id: patient_Id },  // match patient
          include:{
            Injection: true,
          }
        },

        TonicPatients: {
          where: { patient_Id: patient_Id },  // match patient
          include:{
            Tonic: true,
          }
        },
      },
    });

    if (!hospital) {
      return {
        success: false,
        message: "Hospital not found",
        data: null,
      };
    }

    return {
      success: true,
      message: "Hospital data fetched successfully",
      data: hospital,
    };

  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch hospital data",
      error: error.message,
    };
  }
}

  async findOneH(id: number) {
  try {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
    });
    return { data: hospital, status: "success" };
  }catch (error) {
    return { error: error.message, status: "failed" };
  }}

 async update(id: number, data: any) {
  try {
    // Check if hospital exists
    const existingHospital = await this.prisma.hospital.findUnique({ where: { id } });
    if (!existingHospital) {
      return { error: "Hospital not found", status: "failed" };
    }

    const hospital = await this.prisma.hospital.update({
      where: { id },
      data:{
        name: data.name,
        address: data.address,  
        HospitalStatus: data.HospitalStatus,
        phone: data.phone,
        mail: data.mail,
        photo: data.imageUrl,
      }
    });

    return { data: hospital, status: "success"  };
  } catch (error) {
    return { error: error.message, status: "failed" };
  }
}
 async updateS(id: number, data: any) {
  try {
    
    const hospital = await this.prisma.hospital.update({
      where: { id },
      data
    }
    );
    console.log(hospital);
    

    return { data: hospital, status: "success",  };
  } catch (error) {
    return { error: error.message, status: "failed" };
  }
}


  async remove(id: number) {
    try {
      const hospital = await this.prisma.hospital.delete({ where: { id } });
      return { data: hospital, status: "success" };
    } catch (error) {
      return { error: error.message, status: "failed" };
    }
  }
  
}

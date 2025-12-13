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
  
      return { error: "Hospital ID is required",hospitalId:data.hospitalId, status: "failed" };
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

//  async findOne(id: number, patient_Id: string) {
//   try {
//     const hospital = await this.prisma.hospital.findUnique({
//       where: { id },
//       include: {
//         Patients: {
//           where: { user_Id: patient_Id }   // match patient
//         },

//         Admins: {
//           select: {
//             id: true,
//             name: true,
//             user_Id: true,
//             designation: true,
//             role: true,
//             status: true,
//           },
//         },

//         Consultation: {
//           where: { patient_Id: patient_Id }  // match patient
//         },

//         TestingAndScannings: {
//           where: { patient_Id: patient_Id },  // match patient
//         },
//         ScanAndTests: true,

//         Payments: {
//           where: { patient_Id: patient_Id }  // match patient
//         },

//         MedicinePatients: {
//           where: { patient_Id: patient_Id },  // match patient
//           include:{
//             Medician: true,
//           }
          
//         },

//         InjectionPatients: {
//           where: { patient_Id: patient_Id },  // match patient
//           include:{
//             Injection: true,
//           }
//         },

//         TonicPatients: {
//           where: { patient_Id: patient_Id },  // match patient
//           include:{
//             Tonic: true,
//           }
//         },
//       },
//     });

//     if (!hospital) {
//       return {
//         success: false,
//         message: "Hospital not found",
//         data: null,
//       };
//     }

//     return {
//       success: true,
//       message: "Hospital data fetched successfully",
//       data: hospital,
//     };

//   } catch (error) {
//     return {
//       success: false,
//       message: "Failed to fetch hospital data",
//       error: error.message,
//     };
//   }
// }


async findOne(id: number, patient_Id: string) {
  try {
    // ------------------ SAFE HELPERS ------------------
    const normKey = (str: any) =>
      str === null || str === undefined ? "" : String(str).trim().toLowerCase();

    const getSafeField = (obj: unknown, fields: string[]): any => {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
      for (const f of fields) {
        if (f in obj) return (obj as any)[f];
      }
      return null;
    };

    const calcAge = (dob) => {
      if (!dob) return { years: 0, months: 0 };
      const birth = new Date(dob);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth() + years * 12;
      if (now.getDate() < birth.getDate()) months -= 1;
      years = Math.floor(months / 12);
      return { years, months };
    };

    const getReference = (refJson, age, gender) => {
      if (!refJson) return "N/A";
      let parsed = refJson;
      try {
        if (typeof refJson === "string") parsed = JSON.parse(refJson);
      } catch {
        return "N/A";
      }

      const normalized = {};
      Object.keys(parsed).forEach((k) => (normalized[k.toLowerCase()] = parsed[k]));

      const totalMonths = age.months;
      const gKey = gender?.toLowerCase().startsWith("f") ? "f" : "m";

      for (const key of Object.keys(normalized)) {
        const p = key.split("_");
        if (p.length < 3) continue;
        const [min, max, g] = p;
        if (!g.includes(gKey)) continue;
        if (totalMonths >= parseInt(min) && totalMonths <= parseInt(max))
          return normalized[key] ?? "N/A";
      }
      return "N/A";
    };

    // ------------------ 1️⃣ MAIN HOSPITAL FETCH ------------------
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        Patients: { where: { user_Id: patient_Id } },

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

        Consultation: { where: { patient_Id:Number(patient_Id) } },

        TestingAndScannings: {
          where: { patient_Id:Number(patient_Id) },
          include: {
            Hospital: {
              select: {
                id: true,
                name: true,
                address: true,
                ScanAndTests: {
                  select: { id: true, title: true, options: true, type: true },
                },
                Admins: { select: { user_Id: true, name: true } },
              },
            },

            Patient: {
              select: {
                user_Id: true,
                name: true,
                dob: true,
                gender: true,
                bldGrp: true,
                phone: true,
                address: true,
                Consultation: { select: { id: true, doctor_Id: true } },
              },
            },
          },
        },

        Payments: { where: { patient_Id:Number(patient_Id)  } },

        MedicinePatients: { where: { patient_Id:Number(patient_Id)  }, include: { Medician: true } },

        InjectionPatients: { where: { patient_Id:Number(patient_Id)  }, include: { Injection: true } },

        TonicPatients: { where: { patient_Id:Number(patient_Id)  }, include: { Tonic: true } },
      },
    });

    if (!hospital) {
      return { success: false, message: "Hospital not found", data: null };
    }

    // ------------------ 2️⃣ UNIT & REFERENCE MASTER ------------------
    const unitRefs = await this.prisma.scanAndTestUnitReferance.findMany({
      select: { optionName: true, unit: true, referance: true },
    });

    const testRecords = hospital.TestingAndScannings ?? [];

    // ------------------ 3️⃣ DOCTORS ------------------
    const docIds = Array.from(
      new Set(
        testRecords
          .flatMap((r) =>
            Array.isArray(r.Patient?.Consultation)
              ? r.Patient.Consultation.map((c) => c.doctor_Id)
              : []
          )
          .filter(Boolean)
      )
    ).map((id) => id.toString());

    const doctors = await this.prisma.admin.findMany({
      where: { user_Id: { in: docIds } },
      select: { user_Id: true, name: true },
    });

    const doctorMap = new Map<number, string>();
    doctors.forEach((d) => doctorMap.set(Number(d.user_Id), d.name));

    // ------------------ 4️⃣ FORMAT FINAL RESPONSE ------------------
    const formattedTests = testRecords.map((rec) => {
      const hospitalTests = rec.Hospital?.ScanAndTests ?? [];
      const patient = rec.Patient;
      const age = calcAge(patient?.dob);
      const gender = patient?.gender ?? "";

      // ----------- Parse selectedOptions (SAFE) -----------
      const selectedOptionsNormalized: Record<string, any> = {};
      try {
        let raw = rec.selectedOptions;
        if (!raw) raw = {};
        if (typeof raw === "string") {
          try {
            raw = JSON.parse(raw);
          } catch {}
        }

        if (Array.isArray(raw)) {
          raw.forEach((item) => {
            if (typeof item === "string") {
              selectedOptionsNormalized[normKey(item)] = item;
            } else if (item && typeof item === "object" && !Array.isArray(item)) {
              const name = getSafeField(item, ["name", "optionName", "key"]);
              const val =
                getSafeField(item, ["value", "selected"]) ??
                JSON.stringify(item);
              if (name) selectedOptionsNormalized[normKey(name)] = val;
            }
          });
        } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          Object.entries(raw).forEach(([k, v]) => {
            selectedOptionsNormalized[normKey(k)] = v;
          });
        }
      } catch {}

      // ----------- Parse selectedOptionResults (SAFE) -----------
      const selectedResultsNormalized: Record<string, any> = {};
      try {
        let rawR = rec.selectedOptionResults;
        if (!rawR) rawR = {};
        if (typeof rawR === "string") {
          try {
            rawR = JSON.parse(rawR);
          } catch {}
        }

        if (Array.isArray(rawR)) {
          rawR.forEach((item) => {
            if (typeof item === "string") {
              selectedResultsNormalized[normKey(item)] = item;
            } else if (item && typeof item === "object" && !Array.isArray(item)) {
              const name = getSafeField(item, ["name", "optionName", "key"]);
              const val =
                getSafeField(item, ["value", "result"]) ??
                JSON.stringify(item);
              if (name) selectedResultsNormalized[normKey(name)] = val;
            }
          });
        } else if (rawR && typeof rawR === "object" && !Array.isArray(rawR)) {
          Object.entries(rawR).forEach(([k, v]) => {
            selectedResultsNormalized[normKey(k)] = v;
          });
        }
      } catch {}

      // ----------- TEST MATCHING ------------------
      const matchedTests = hospitalTests.filter(
        (t) => t.title?.toUpperCase() === rec.title?.toUpperCase()
      );

      const detailed = matchedTests.map((test) => {
        const opts: any[] = (() => {
          if (Array.isArray(test.options)) return test.options;
          if (typeof test.options === "string") {
            try {
              return JSON.parse(test.options);
            } catch {
              return [];
            }
          }
          if (typeof test.options === "object" && test.options !== null) {
            if ("length" in test.options) return test.options as any;
            return Object.values(test.options as Record<string, any>);
          }
          return [];
        })();

        const mergedOpts = opts.map((opt) => {
          const optNameKey = normKey(
            opt.name ?? opt.optionName ?? opt.label ?? ""
          );

          const unitInfo = unitRefs.find(
            (u) => normKey(u.optionName) === optNameKey
          );
          const reference = unitInfo
            ? getReference(unitInfo.referance, age, gender)
            : "N/A";

          return {
            name: opt.name,
            unit: unitInfo?.unit ?? "N/A",
            price: opt.price ?? null,
            reference,
            selectedOption: selectedOptionsNormalized[optNameKey] ?? "N/A",
            result: selectedResultsNormalized[optNameKey] ?? "N/A",
          };
        });

        return {
          id: test.id,
          title: test.title,
          type: test.type,
          options: mergedOpts,
        };
      });

      // ----------- DOCTOR INFO -----------
      const doctorInfo = (() => {
        const cons = patient?.Consultation?.[0];
        const dId = Number(cons?.doctor_Id);
        return {
          id: dId ? String(dId) : "N/A",
          name: dId ? doctorMap.get(dId) ?? "N/A" : "N/A",
          consultationId: cons?.id ? String(cons.id) : "N/A",
        };
      })();

      // ----------- PHONE FORMAT -----------
      const phoneNumber = (() => {
        const ph = patient?.phone;
        if (!ph) return "-";
        if (typeof ph === "string") return ph;
        if (typeof ph === "object" && ph !== null && "mobile" in ph)
          return (ph as any).mobile ?? "-";
        return "-";
      })();

      // ----------- FINAL ITEM -----------
      return {
        id: rec.id,
        title: rec.title,
        type: rec.type,
        status: rec.status,
        scheduleDate: rec.scheduleDate,
        createdAt: rec.createdAt,

        Patient: {
          name: patient?.name ?? "N/A",
          gender,
          bldGrp: patient?.bldGrp ?? "N/A",
          user_Id: patient?.user_Id ?? "N/A",
          age: calcAge(patient?.dob).years,
          dob: patient?.dob ?? "",
          phone: phoneNumber,
          address: patient?.address ?? {},
          doctor: doctorInfo,
        },

        Hospital: {
          name: rec.Hospital?.name ?? "N/A",
          address: rec.Hospital?.address ?? "N/A",
        },

        testDetails: detailed,
      };
    });

    // ------------------ FINAL RETURN ------------------
    return {
      success: true,
      message: "Hospital data fetched successfully",
      data: {
        ...hospital,
        TestingAndScannings: formattedTests,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch hospital data",
      error: error.message,
    };
  }
}

 //===========================================================================
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

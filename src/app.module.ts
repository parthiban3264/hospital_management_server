import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HospitalModule } from './Hospitals/hospital.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './Users/user.module';
import { PatientModule } from './Patient/patient.module';
import { AdminModule } from './Admins/admin.module';
import { ConsultationModule } from './Consultation/Consultation.Module';
import { TreatmentModule } from './Treatments/Treatment.Module';
import { MedicianModule } from './Medicians/Medician.Module';
import { InjectionModule } from './Injections/Injection.Module';
import { MedicineAndInjectionModule } from './MedicineAndInjections/MedicineAndInjection.Module';
import { TestingAndScanningHospitalModule } from './TestingAndScanningHospitals/testingAndScanningHospital.module';
import { TestingAndScanningPatientModule } from './TestingAndScanningPatient/testingAndScanningPatient.module';
import { PaymentModule } from './Payments/payment.module';
import { RoomsAvailableModule } from './RoomsAvailables/rooms-available.module';
import { TonicModule } from './Tonic/tonic.module';
import { MedicineTonicInjectionModule } from './MedicineTonicInjection/medicineTonicInjection.module';
import { ScanAndTestModule } from './TestAndScan/test-scan.module';
import { DrawerModule } from './Drawer/drawer.module';
import { IncomeAndExpenseModule } from './IncomeExpense/incomeExpense.module';
import {AdminStratorModule  } from './AdminStrator/adminstrator.module';
import { FeesModule } from './Fees/fees.module';
import { CosmeticModule } from './cosmetic/cosmetic.module';
@Module({
  imports: [HospitalModule,
    UserModule,
    PatientModule,
    AdminModule,
    AdminStratorModule,
    ConsultationModule,
    TreatmentModule,
    MedicianModule,
    InjectionModule,
    MedicineAndInjectionModule,
    TestingAndScanningHospitalModule,
    TestingAndScanningPatientModule,
    PaymentModule,
    RoomsAvailableModule,
    TonicModule,
    MedicineTonicInjectionModule,
    ScanAndTestModule,
    DrawerModule,
    IncomeAndExpenseModule,
    FeesModule,
    CosmeticModule,
  ],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule {}

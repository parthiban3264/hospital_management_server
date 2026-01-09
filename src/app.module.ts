import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { HospitalModule } from './Hospitals/hospital.module';
import { PrismaService } from './prisma/prisma.service';
import { UserModule } from './Users/user.module';
import { PatientModule } from './Patient/patient.module';
import { AdminModule } from './Admins/admin.module';
import { ConsultationModule } from './Consultation/Consultation.Module';
//import { TreatmentModule } from './Treatments/Treatment.Module';
import { MedicianModule } from './Medicians/Medician.Module';
import { InjectionModule } from './Injections/Injection.Module';
// import { MedicineAndInjectionModule } from './MedicineAndInjections/MedicineAndInjection.Module';
//import { TestingAndScanningHospitalModule } from './TestingAndScanningHospitals/testingAndScanningHospital.module';
import { TestingAndScanningPatientModule } from './TestingAndScanningPatient/testingAndScanningPatient.module';
import { PaymentModule } from './Payments/payment.module';
//import { RoomsAvailableModule } from './RoomsAvailables/rooms-available.module';
import { TonicModule } from './Tonic/tonic.module';
import { MedicineTonicInjectionModule } from './MedicineTonicInjection/medicineTonicInjection.module';
import { ScanAndTestModule } from './TestAndScan/test-scan.module';
import { DrawerModule } from './Drawer/drawer.module';
import { IncomeAndExpenseModule } from './IncomeExpense/incomeExpense.module';
import {AdminStratorModule  } from './AdminStrator/adminstrator.module';
import { FeesModule } from './Fees/fees.module';
//import { CosmeticModule } from './cosmetic/cosmetic.module';
import { ButtonPermissionModule } from './Button_Permission/button-permission.module';
import { ScanAndTestsModule } from './TestAndScans/test.scans.module';
import { ScanAndTestUnitReferenceModule } from './scan-and-test-unit-reference/scan-and-test-unit-reference.module';
import { WardModule } from './ward/ward.module';
import { MedicineBatchModule } from './medicine-batch/medicine-batch.module';
import { StockMovementModule } from './stock/stock-movement.module';
import { SupplierModule } from './supplier/supplier.module';
import { MedicineValueModule } from './medicine-value/medicine-value.module';
import { MedicineModule } from './medicine/medicine.module';
import { InventoryModule } from './inventory/inventory.module';
import { AdmissionModule } from './admission/admission/admission.module';
import { ChargesModule } from './charges/charges/charges.module';
import { PrescriptionModule } from './prescription/prescription.module';
//import { SalesModule } from './sales/sale.module';
//import { BillingModule } from './shivani/billing/billing.module';
@Module({
  imports: [//HospitalModule,
    UserModule,
    PatientModule,
    AdminModule,
    AdminStratorModule,
    ConsultationModule,
    //TreatmentModule,
    MedicianModule,
    InjectionModule,
    // MedicineAndInjectionModule,
    //TestingAndScanningHospitalModule,
    TestingAndScanningPatientModule,
    PaymentModule,
    //RoomsAvailableModule,
    TonicModule,
    MedicineTonicInjectionModule,
    ScanAndTestModule,
    DrawerModule,
    IncomeAndExpenseModule,
    FeesModule,
    //CosmeticModule,
    ButtonPermissionModule,
    ScanAndTestsModule,
    ScanAndTestUnitReferenceModule,
    //BillingModule,
    WardModule,
    MedicineBatchModule,
    StockMovementModule,
    SupplierModule,
    MedicineValueModule,
    MedicineModule,
    InventoryModule,
    //SalesModule,
    AdmissionModule,
    ChargesModule,
    PrescriptionModule,
    
  ],
  controllers: [AppController],
  providers: [AppService,PrismaService],
})
export class AppModule {}

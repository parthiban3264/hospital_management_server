-- CreateTable
CREATE TABLE `Hospital` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `HospitalStatus` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `phone` VARCHAR(191) NOT NULL,
    `mail` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `user_Id` INTEGER NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `user_Id` INTEGER NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminStrator` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_Id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `destination` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `user_Id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` JSON NOT NULL,
    `email` JSON NOT NULL,
    `photo` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `address` JSON NULL,
    `dob` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `bldGrp` VARCHAR(191) NOT NULL,
    `currentProblem` VARCHAR(191) NOT NULL,
    `medicalHistory` VARCHAR(191) NOT NULL,
    `height` DOUBLE NOT NULL,
    `weight` DOUBLE NOT NULL,
    `bp` VARCHAR(191) NOT NULL,
    `sugar` VARCHAR(191) NOT NULL,
    `custom` JSON NOT NULL,
    `tempCreatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Consultation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `patient_Id` INTEGER NOT NULL,
    `doctor_Id` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `purpose` VARCHAR(191) NOT NULL,
    `temperature` DOUBLE NOT NULL,
    `symptoms` VARCHAR(191) NOT NULL,
    `notes` JSON NOT NULL,
    `diagnosis` VARCHAR(191) NOT NULL,
    `treatment` BOOLEAN NOT NULL,
    `medicineInjection` BOOLEAN NOT NULL,
    `scanningTesting` BOOLEAN NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `access` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paymentStatus` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Treatment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `staff_Id` JSON NOT NULL,
    `patient_Id` INTEGER NOT NULL,
    `doctor_Id` JSON NOT NULL,
    `treatmentName` JSON NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `progress` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `paymentStatus` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Medician` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `medicianName` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `staffId` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Injection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `injectionName` VARCHAR(191) NOT NULL,
    `stock` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `staffId` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestingAndScanningH` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `roomNo` VARCHAR(191) NOT NULL,
    `staffId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MedicineAndInjection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `patient_Id` INTEGER NOT NULL,
    `doctor_Id` JSON NOT NULL,
    `staff_Id` JSON NOT NULL,
    `medicine_Id` JSON NOT NULL,
    `frequencyMedicine` JSON NOT NULL,
    `injection_Id` JSON NOT NULL,
    `frequencyInjection` JSON NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `notes` JSON NOT NULL,
    `paymentStatus` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestingAndScanningP` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `patient_Id` INTEGER NOT NULL,
    `doctor_Id` JSON NOT NULL,
    `staff_Id` JSON NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `scheduleDate` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `paymentStatus` BOOLEAN NOT NULL,
    `result` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `patient_Id` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('success', 'failed') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `transactionId` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomsAvailable` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hospital_Id` INTEGER NOT NULL,
    `staffId` INTEGER NOT NULL,
    `roomNo` VARCHAR(191) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `notes` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Doctor_Treatment` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Doctor_Treatment_AB_unique`(`A`, `B`),
    INDEX `_Doctor_Treatment_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Staff_Treatment` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Staff_Treatment_AB_unique`(`A`, `B`),
    INDEX `_Staff_Treatment_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_MedicineAndInjection_Medician` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_MedicineAndInjection_Medician_AB_unique`(`A`, `B`),
    INDEX `_MedicineAndInjection_Medician_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_Injection_MedicineAndInjection` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_Injection_MedicineAndInjection_AB_unique`(`A`, `B`),
    INDEX `_Injection_MedicineAndInjection_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Admin` ADD CONSTRAINT `Admin_user_Id_fkey` FOREIGN KEY (`user_Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminStrator` ADD CONSTRAINT `AdminStrator_user_Id_fkey` FOREIGN KEY (`user_Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_user_Id_fkey` FOREIGN KEY (`user_Id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_patient_Id_fkey` FOREIGN KEY (`patient_Id`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Consultation` ADD CONSTRAINT `Consultation_doctor_Id_fkey` FOREIGN KEY (`doctor_Id`) REFERENCES `Admin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Treatment` ADD CONSTRAINT `Treatment_patient_Id_fkey` FOREIGN KEY (`patient_Id`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Medician` ADD CONSTRAINT `Medician_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Injection` ADD CONSTRAINT `Injection_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestingAndScanningH` ADD CONSTRAINT `TestingAndScanningH_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicineAndInjection` ADD CONSTRAINT `MedicineAndInjection_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MedicineAndInjection` ADD CONSTRAINT `MedicineAndInjection_patient_Id_fkey` FOREIGN KEY (`patient_Id`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestingAndScanningP` ADD CONSTRAINT `TestingAndScanningP_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TestingAndScanningP` ADD CONSTRAINT `TestingAndScanningP_patient_Id_fkey` FOREIGN KEY (`patient_Id`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_patient_Id_fkey` FOREIGN KEY (`patient_Id`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomsAvailable` ADD CONSTRAINT `RoomsAvailable_hospital_Id_fkey` FOREIGN KEY (`hospital_Id`) REFERENCES `Hospital`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Doctor_Treatment` ADD CONSTRAINT `_Doctor_Treatment_A_fkey` FOREIGN KEY (`A`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Doctor_Treatment` ADD CONSTRAINT `_Doctor_Treatment_B_fkey` FOREIGN KEY (`B`) REFERENCES `Treatment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Staff_Treatment` ADD CONSTRAINT `_Staff_Treatment_A_fkey` FOREIGN KEY (`A`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Staff_Treatment` ADD CONSTRAINT `_Staff_Treatment_B_fkey` FOREIGN KEY (`B`) REFERENCES `Treatment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MedicineAndInjection_Medician` ADD CONSTRAINT `_MedicineAndInjection_Medician_A_fkey` FOREIGN KEY (`A`) REFERENCES `Medician`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MedicineAndInjection_Medician` ADD CONSTRAINT `_MedicineAndInjection_Medician_B_fkey` FOREIGN KEY (`B`) REFERENCES `MedicineAndInjection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Injection_MedicineAndInjection` ADD CONSTRAINT `_Injection_MedicineAndInjection_A_fkey` FOREIGN KEY (`A`) REFERENCES `Injection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_Injection_MedicineAndInjection` ADD CONSTRAINT `_Injection_MedicineAndInjection_B_fkey` FOREIGN KEY (`B`) REFERENCES `MedicineAndInjection`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanTestDto } from './dto/create-scan-test.dto';
import { UpdateScanTestDto } from './dto/update-scan-test.dto';
import { log } from 'console';
@Injectable()
export class AAScanAndTestingService {
    constructor(private readonly prisma: PrismaService) { }
    async findAllByHospital(hospital_Id: number) {

        return this.prisma.scanAndTestsWithPerHospital.findMany({
            where: { hospital_Id },
            include: { options: true },
        });
    }
    //   async findAllByHospital(hospital_Id: number) {
    //     return this.prisma.scanAndTestsWithPerHospital.findMany({
    //       where: { hospital_Id },
    //       include: {
    //         options: true,
    //       },
    //     });
    //   }

    async create(dto: CreateScanTestDto) {
        log('Creating Scan/Test with DTO:', dto);   
        return this.prisma.scanAndTestsWithPerHospital.create({
            data: {
                hospital_Id: dto.hospital_Id,
                title: dto.title,
                type: dto.type as any,
                amount: dto.amount,
                options: dto.options
                    ? {
                        create: dto.options.map((o) => ({
                            hospital_Id: dto.hospital_Id,
                            optionName: o.optionName,
                            type: o.type,
                            unit: o.unit,
                            price: o.price,
                            reference: o.reference,
                        })),
                    }
                    : undefined,
            },
            include: {
                options: true,
            },
        });
    }

    async update(id: number, dto: UpdateScanTestDto) {
        const existing =
            await this.prisma.scanAndTestsWithPerHospital.findUnique({
                where: { id },
                include: { options: true },
            });

        if (!existing) {
            throw new NotFoundException('Scan/Test not found');
        }

        return this.prisma.scanAndTestsWithPerHospital.update({
            where: { id },
            data: {
                title: dto.title,
                type: dto.type as any,
                amount: dto.amount,
                options: dto.options
                    ? {
                        deleteMany: {
                            scanTestId: id,
                        },
                        create: dto.options.map((o) => ({
                            hospital_Id: existing.hospital_Id,
                            optionName: o.optionName,
                            type: o.type,
                            unit: o.unit,
                            price: o.price,
                            reference: o.reference,
                        })),
                    }
                    : undefined,
            },
            include: {
                options: true,
            },
        });
    }

    async delete(id: number) {
        const existing =
            await this.prisma.scanAndTestsWithPerHospital.findUnique({
                where: { id },
            });

        if (!existing) {
            throw new NotFoundException('Scan/Test not found');
        }

        await this.prisma.scanAndTestUnitReferencewithPerHospital.deleteMany({
            where: { scanTestId: id },
        });

        return this.prisma.scanAndTestsWithPerHospital.delete({
            where: { id },
        });
    }
    async deleteOption(id: number) {
        const existing =
            await this.prisma.scanAndTestUnitReferencewithPerHospital.findUnique({
                where: { id },
            });

        if (!existing) {
            throw new NotFoundException('Scan/Test not found');
        }

        const existings =
            await this.prisma.scanAndTestUnitReferencewithPerHospital.findMany({
                where: { scanTestId: existing.scanTestId },
            });
        if (existings.length == 1) {
            await this.prisma.scanAndTestUnitReferencewithPerHospital.deleteMany({
                where: { id },
            });

            return this.prisma.scanAndTestsWithPerHospital.delete({
                where: { id: existing.scanTestId },
            });
        }
        if (existings.length > 1) {
            return this.prisma.scanAndTestUnitReferencewithPerHospital.delete({
                where: { id },
            });
        }
    }
    async updateStatus(id: number, isActive: boolean) {
        const existing =
            await this.prisma.scanAndTestsWithPerHospital.findUnique({
                where: { id },
            });

        if (!existing) {
            throw new NotFoundException('Scan/Test not found');
        }

        await this.prisma.scanAndTestUnitReferencewithPerHospital.updateMany({
            where: { scanTestId: id },
            data: {
                isActive
            }
        });

        return this.prisma.scanAndTestsWithPerHospital.update({
            where: { id },
            data: {
                isActive
            }
        });
    }
    async updateStatusOptions(id: number, isActive: boolean) {
        const existing =
            await this.prisma.scanAndTestUnitReferencewithPerHospital.findUnique({
                where: { id },
            });

        if (!existing) {
            throw new NotFoundException('Scan/Test not found');
        }

        // 1️⃣ Update the option
        await this.prisma.scanAndTestUnitReferencewithPerHospital.update({
            where: { id },
            data: { isActive },
        });

        // 2️⃣ Count active options AFTER update
        const activeCount =
            await this.prisma.scanAndTestUnitReferencewithPerHospital.count({
                where: {
                    scanTestId: existing.scanTestId,
                    isActive: true,
                },
            });

        // 3️⃣ Update scan status
        return this.prisma.scanAndTestsWithPerHospital.update({
            where: { id: existing.scanTestId },
            data: {
                isActive: activeCount > 0, // 👈 key rule
            },
        });
    }

}
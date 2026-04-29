import { Injectable, NotFoundException } from '@nestjs/common';
import { Service as AgendaService } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prismaService: PrismaService) {}

  create(
    tenantId: string,
    createServiceDto: CreateServiceDto,
  ): Promise<AgendaService> {
    return this.prismaService.service.create({
      data: {
        tenantId,
        name: createServiceDto.name,
        description: createServiceDto.description,
        durationMinutes: createServiceDto.durationMinutes,
        priceCents: createServiceDto.priceCents,
        currency: createServiceDto.currency ?? 'EUR',
        bufferMinutes: createServiceDto.bufferMinutes ?? 0,
      },
    });
  }

  listByTenant(tenantId: string): Promise<AgendaService[]> {
    return this.prismaService.service.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    tenantId: string,
    serviceId: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<AgendaService> {
    await this.getById(tenantId, serviceId);

    return this.prismaService.service.update({
      where: {
        id: serviceId,
      },
      data: updateServiceDto,
    });
  }

  async remove(tenantId: string, serviceId: string): Promise<AgendaService> {
    await this.getById(tenantId, serviceId);

    return this.prismaService.service.update({
      where: {
        id: serviceId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async getById(tenantId: string, serviceId: string): Promise<AgendaService> {
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return service;
  }
}

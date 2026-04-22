import { Injectable, NotFoundException } from '@nestjs/common';
import { Automation } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { ToggleAutomationDto } from './dto/toggle-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';

@Injectable()
export class AutomationsService {
  constructor(private readonly prismaService: PrismaService) {}

  create(tenantId: string, createAutomationDto: CreateAutomationDto): Promise<Automation> {
    return this.prismaService.automation.create({
      data: {
        tenantId,
        name: createAutomationDto.name,
        triggerType: createAutomationDto.triggerType,
        triggerValue: createAutomationDto.triggerValue,
        actionType: createAutomationDto.actionType,
        actionValue: createAutomationDto.actionValue,
        isActive: createAutomationDto.isActive,
      },
    });
  }

  listByTenant(tenantId: string): Promise<Automation[]> {
    return this.prismaService.automation.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  listActiveByTenant(tenantId: string): Promise<Automation[]> {
    return this.prismaService.automation.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    tenantId: string,
    automationId: string,
    updateAutomationDto: UpdateAutomationDto,
  ): Promise<Automation> {
    await this.getById(tenantId, automationId);

    return this.prismaService.automation.update({
      where: {
        id: automationId,
      },
      data: {
        ...updateAutomationDto,
      },
    });
  }

  async toggle(
    tenantId: string,
    automationId: string,
    toggleAutomationDto: ToggleAutomationDto,
  ): Promise<Automation> {
    await this.getById(tenantId, automationId);

    return this.prismaService.automation.update({
      where: {
        id: automationId,
      },
      data: {
        isActive: toggleAutomationDto.isActive,
      },
    });
  }

  async remove(tenantId: string, automationId: string): Promise<Automation> {
    await this.getById(tenantId, automationId);

    return this.prismaService.automation.delete({
      where: {
        id: automationId,
      },
    });
  }

  private async getById(tenantId: string, automationId: string): Promise<Automation> {
    const automation = await this.prismaService.automation.findFirst({
      where: {
        id: automationId,
        tenantId,
      },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found.');
    }

    return automation;
  }
}

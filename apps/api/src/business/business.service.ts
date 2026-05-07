import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  allowedBusinessCurrencies,
  BusinessCurrency,
  UpdateBusinessSettingsDto,
} from './dto/update-business-settings.dto';

export type BusinessSettingsResponse = {
  defaultCurrency: BusinessCurrency;
};

@Injectable()
export class BusinessService {
  constructor(private readonly prismaService: PrismaService) {}

  async getSettings(tenantId: string): Promise<BusinessSettingsResponse> {
    const tenant = await this.prismaService.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { defaultCurrency: true },
    });

    return {
      defaultCurrency: this.normalizeCurrency(tenant.defaultCurrency),
    };
  }

  async updateSettings(
    tenantId: string,
    updateBusinessSettingsDto: UpdateBusinessSettingsDto,
  ): Promise<BusinessSettingsResponse> {
    const defaultCurrency = this.normalizeCurrency(
      updateBusinessSettingsDto.defaultCurrency,
    );

    const tenant = await this.prismaService.tenant.update({
      where: { id: tenantId },
      data: { defaultCurrency },
      select: { defaultCurrency: true },
    });

    return {
      defaultCurrency: this.normalizeCurrency(tenant.defaultCurrency),
    };
  }

  private normalizeCurrency(value: string): BusinessCurrency {
    const normalizedValue = value.trim().toUpperCase();

    if (!this.isAllowedCurrency(normalizedValue)) {
      throw new BadRequestException('Unsupported default currency.');
    }

    return normalizedValue;
  }

  private isAllowedCurrency(value: string): value is BusinessCurrency {
    return allowedBusinessCurrencies.includes(value as BusinessCurrency);
  }
}

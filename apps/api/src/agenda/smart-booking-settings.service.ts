import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import {
  SmartBookingMissingInfoBehavior,
  SmartBookingMode,
  SmartBookingSettings,
} from '@prisma/client';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSmartBookingSettingsDto } from './dto/update-smart-booking-settings.dto';

type SmartBookingSettingsResponse = {
  enabled: boolean;
  mode: SmartBookingMode;
  maxSuggestions: number;
  missingInfoBehavior: SmartBookingMissingInfoBehavior;
  locked: boolean;
  canUseAutoBookingConfirm: boolean;
};

const defaultSmartBookingSettings = {
  enabled: false,
  mode: SmartBookingMode.SUGGEST_SLOTS,
  maxSuggestions: 3,
  missingInfoBehavior: SmartBookingMissingInfoBehavior.ASK_CLIENT,
};

@Injectable()
export class SmartBookingSettingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async get(tenantId: string): Promise<SmartBookingSettingsResponse> {
    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);

    if (!entitlements.features.canUseSmartBooking) {
      return this.serialize(defaultSmartBookingSettings, {
        locked: true,
        canUseAutoBookingConfirm:
          entitlements.features.canUseAutoBookingConfirm,
      });
    }

    const settings = await this.prismaService.smartBookingSettings.findUnique({
      where: {
        tenantId,
      },
    });

    return this.serialize(settings ?? defaultSmartBookingSettings, {
      locked: false,
      canUseAutoBookingConfirm: entitlements.features.canUseAutoBookingConfirm,
    });
  }

  async update(
    tenantId: string,
    updateSmartBookingSettingsDto: UpdateSmartBookingSettingsDto,
  ): Promise<SmartBookingSettingsResponse> {
    const entitlements =
      await this.entitlementsService.getTenantEntitlements(tenantId);

    if (!entitlements.features.canUseSmartBooking) {
      throw new ForbiddenException(
        'La agenda inteligente esta disponible en Premium.',
      );
    }

    if (
      updateSmartBookingSettingsDto.mode === SmartBookingMode.AUTO_CONFIRM &&
      !entitlements.features.canUseAutoBookingConfirm
    ) {
      throw new BadRequestException(
        'La confirmacion automatica no esta disponible en tu plan.',
      );
    }

    const data = this.buildUpdateData(updateSmartBookingSettingsDto);
    const settings = await this.prismaService.smartBookingSettings.upsert({
      where: {
        tenantId,
      },
      create: {
        tenantId,
        ...defaultSmartBookingSettings,
        ...data,
      },
      update: data,
    });

    return this.serialize(settings, {
      locked: false,
      canUseAutoBookingConfirm: entitlements.features.canUseAutoBookingConfirm,
    });
  }

  private buildUpdateData(
    updateSmartBookingSettingsDto: UpdateSmartBookingSettingsDto,
  ): Partial<
    Pick<
      SmartBookingSettings,
      'enabled' | 'mode' | 'maxSuggestions' | 'missingInfoBehavior'
    >
  > {
    return {
      ...(updateSmartBookingSettingsDto.enabled !== undefined
        ? { enabled: updateSmartBookingSettingsDto.enabled }
        : {}),
      ...(updateSmartBookingSettingsDto.mode !== undefined
        ? { mode: updateSmartBookingSettingsDto.mode }
        : {}),
      ...(updateSmartBookingSettingsDto.maxSuggestions !== undefined
        ? { maxSuggestions: updateSmartBookingSettingsDto.maxSuggestions }
        : {}),
      ...(updateSmartBookingSettingsDto.missingInfoBehavior !== undefined
        ? {
            missingInfoBehavior:
              updateSmartBookingSettingsDto.missingInfoBehavior,
          }
        : {}),
    };
  }

  private serialize(
    settings: Pick<
      SmartBookingSettings,
      'enabled' | 'mode' | 'maxSuggestions' | 'missingInfoBehavior'
    >,
    access: Pick<SmartBookingSettingsResponse, 'locked' | 'canUseAutoBookingConfirm'>,
  ): SmartBookingSettingsResponse {
    return {
      enabled: settings.enabled,
      mode: settings.mode,
      maxSuggestions: settings.maxSuggestions,
      missingInfoBehavior: settings.missingInfoBehavior,
      locked: access.locked,
      canUseAutoBookingConfirm: access.canUseAutoBookingConfirm,
    };
  }
}

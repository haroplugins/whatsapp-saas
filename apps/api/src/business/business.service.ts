import { BadRequestException, Injectable } from '@nestjs/common';
import { BusinessProfile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  allowedBusinessProfileTones,
  BusinessProfileTone,
  UpdateBusinessProfileDto,
} from './dto/update-business-profile.dto';
import {
  allowedBusinessCurrencies,
  BusinessCurrency,
  UpdateBusinessSettingsDto,
} from './dto/update-business-settings.dto';

export type BusinessSettingsResponse = {
  defaultCurrency: BusinessCurrency;
};

export type BusinessProfileResponse = {
  businessName: string;
  serviceType: string;
  shortDescription: string;
  publicPhone: string;
  publicEmail: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  twitterX: string;
  addressOrServiceArea: string;
  paymentMethods: string;
  cancellationPolicy: string;
  responseTime: string;
  importantNotes: string;
  tone: BusinessProfileTone;
  baseMessage: string;
};

const defaultBusinessProfile: BusinessProfileResponse = {
  businessName: 'Mi negocio',
  serviceType: 'servicio general',
  shortDescription: '',
  publicPhone: '',
  publicEmail: '',
  website: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  linkedin: '',
  twitterX: '',
  addressOrServiceArea: '',
  paymentMethods: '',
  cancellationPolicy: '',
  responseTime: '',
  importantNotes: '',
  tone: 'friendly',
  baseMessage: '',
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

  async getProfile(tenantId: string): Promise<BusinessProfileResponse> {
    const profile = await this.prismaService.businessProfile.findUnique({
      where: { tenantId },
    });

    return profile ? this.serializeProfile(profile) : defaultBusinessProfile;
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

  async updateProfile(
    tenantId: string,
    updateBusinessProfileDto: UpdateBusinessProfileDto,
  ): Promise<BusinessProfileResponse> {
    const currentProfile = await this.prismaService.businessProfile.findUnique({
      where: { tenantId },
    });
    const profileData = this.buildProfileData(
      updateBusinessProfileDto,
      currentProfile,
    );

    const profile = await this.prismaService.businessProfile.upsert({
      where: { tenantId },
      update: profileData,
      create: {
        tenantId,
        ...profileData,
      },
    });

    return this.serializeProfile(profile);
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

  private buildProfileData(
    input: UpdateBusinessProfileDto,
    currentProfile: BusinessProfile | null,
  ): BusinessProfileResponse {
    const current = currentProfile
      ? this.serializeProfile(currentProfile)
      : defaultBusinessProfile;

    return {
      businessName: this.normalizeProfileText(
        input.businessName ?? current.businessName,
      ),
      serviceType: this.normalizeProfileText(
        input.serviceType ?? current.serviceType,
      ),
      shortDescription: this.normalizeProfileText(
        input.shortDescription ?? current.shortDescription,
      ),
      publicPhone: this.normalizeProfileText(
        input.publicPhone ?? current.publicPhone,
      ),
      publicEmail: this.normalizeProfileText(
        input.publicEmail ?? current.publicEmail,
      ),
      website: this.normalizeProfileText(input.website ?? current.website),
      instagram: this.normalizeProfileText(
        input.instagram ?? current.instagram,
      ),
      facebook: this.normalizeProfileText(input.facebook ?? current.facebook),
      tiktok: this.normalizeProfileText(input.tiktok ?? current.tiktok),
      youtube: this.normalizeProfileText(input.youtube ?? current.youtube),
      linkedin: this.normalizeProfileText(input.linkedin ?? current.linkedin),
      twitterX: this.normalizeProfileText(input.twitterX ?? current.twitterX),
      addressOrServiceArea: this.normalizeProfileText(
        input.addressOrServiceArea ?? current.addressOrServiceArea,
      ),
      paymentMethods: this.normalizeProfileText(
        input.paymentMethods ?? current.paymentMethods,
      ),
      cancellationPolicy: this.normalizeProfileText(
        input.cancellationPolicy ?? current.cancellationPolicy,
      ),
      responseTime: this.normalizeProfileText(
        input.responseTime ?? current.responseTime,
      ),
      importantNotes: this.normalizeProfileText(
        input.importantNotes ?? current.importantNotes,
      ),
      tone: this.normalizeProfileTone(input.tone ?? current.tone),
      baseMessage: this.normalizeProfileText(
        input.baseMessage ?? current.baseMessage,
      ),
    };
  }

  private serializeProfile(profile: BusinessProfile): BusinessProfileResponse {
    return {
      businessName: this.normalizeProfileText(profile.businessName),
      serviceType: this.normalizeProfileText(profile.serviceType),
      shortDescription: this.normalizeProfileText(profile.shortDescription),
      publicPhone: this.normalizeProfileText(profile.publicPhone),
      publicEmail: this.normalizeProfileText(profile.publicEmail),
      website: this.normalizeProfileText(profile.website),
      instagram: this.normalizeProfileText(profile.instagram),
      facebook: this.normalizeProfileText(profile.facebook),
      tiktok: this.normalizeProfileText(profile.tiktok),
      youtube: this.normalizeProfileText(profile.youtube),
      linkedin: this.normalizeProfileText(profile.linkedin),
      twitterX: this.normalizeProfileText(profile.twitterX),
      addressOrServiceArea: this.normalizeProfileText(
        profile.addressOrServiceArea,
      ),
      paymentMethods: this.normalizeProfileText(profile.paymentMethods),
      cancellationPolicy: this.normalizeProfileText(profile.cancellationPolicy),
      responseTime: this.normalizeProfileText(profile.responseTime),
      importantNotes: this.normalizeProfileText(profile.importantNotes),
      tone: this.normalizeProfileTone(profile.tone),
      baseMessage: this.normalizeProfileText(profile.baseMessage),
    };
  }

  private normalizeProfileText(value: string): string {
    return value.trim();
  }

  private normalizeProfileTone(value: string): BusinessProfileTone {
    if (
      allowedBusinessProfileTones.includes(value as BusinessProfileTone)
    ) {
      return value as BusinessProfileTone;
    }

    return defaultBusinessProfile.tone;
  }
}

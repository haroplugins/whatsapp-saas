import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const allowedBusinessProfileTones = ['friendly', 'formal'] as const;

export type BusinessProfileTone = (typeof allowedBusinessProfileTones)[number];

function TrimmedString() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

export class UpdateBusinessProfileDto {
  @IsOptional()
  @IsString()
  @TrimmedString()
  businessName?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  publicPhone?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  publicEmail?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  website?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  instagram?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  facebook?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  tiktok?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  youtube?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  linkedin?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  twitterX?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  addressOrServiceArea?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  paymentMethods?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  cancellationPolicy?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  responseTime?: string;

  @IsOptional()
  @IsString()
  @TrimmedString()
  importantNotes?: string;

  @IsOptional()
  @IsIn(allowedBusinessProfileTones)
  tone?: BusinessProfileTone;

  @IsOptional()
  @IsString()
  @TrimmedString()
  baseMessage?: string;
}

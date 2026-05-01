import {
  SmartBookingMissingInfoBehavior,
  SmartBookingMode,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateSmartBookingSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(SmartBookingMode)
  mode?: SmartBookingMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxSuggestions?: number;

  @IsOptional()
  @IsEnum(SmartBookingMissingInfoBehavior)
  missingInfoBehavior?: SmartBookingMissingInfoBehavior;
}

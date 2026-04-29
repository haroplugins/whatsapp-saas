import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBookingSettingsDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  timezone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minNoticeHours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDaysAhead?: number;

  @IsOptional()
  @IsBoolean()
  requireHumanConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  allowAutoConfirm?: boolean;
}

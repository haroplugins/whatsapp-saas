import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export class AvailabilityRuleInputDto {
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @Matches(timePattern)
  startTime!: string;

  @Matches(timePattern)
  endTime!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAvailabilityRulesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleInputDto)
  rules!: AvailabilityRuleInputDto[];
}

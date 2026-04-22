import { ActionType, TriggerType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAutomationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(TriggerType)
  triggerType?: TriggerType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  triggerValue?: string;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  actionValue?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

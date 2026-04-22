import { ActionType, TriggerType } from '@prisma/client';
import { IsBoolean, IsEnum, IsString, MinLength } from 'class-validator';

export class CreateAutomationDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(TriggerType)
  triggerType!: TriggerType;

  @IsString()
  @MinLength(1)
  triggerValue!: string;

  @IsEnum(ActionType)
  actionType!: ActionType;

  @IsString()
  @MinLength(1)
  actionValue!: string;

  @IsBoolean()
  isActive!: boolean;
}

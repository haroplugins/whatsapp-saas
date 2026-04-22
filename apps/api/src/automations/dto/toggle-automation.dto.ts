import { IsBoolean } from 'class-validator';

export class ToggleAutomationDto {
  @IsBoolean()
  isActive!: boolean;
}

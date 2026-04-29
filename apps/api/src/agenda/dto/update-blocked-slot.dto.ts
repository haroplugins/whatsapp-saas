import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateBlockedSlotDto {
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

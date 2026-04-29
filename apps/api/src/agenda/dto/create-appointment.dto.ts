import { AppointmentSource, AppointmentStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  serviceId?: string;

  @IsString()
  @MinLength(1)
  customerName!: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsEnum(AppointmentSource)
  source?: AppointmentSource;

  @IsOptional()
  @IsString()
  notes?: string;
}

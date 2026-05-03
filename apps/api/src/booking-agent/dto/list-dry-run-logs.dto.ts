import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListDryRunLogsDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  limit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  intent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  decision?: string;
}

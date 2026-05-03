import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SimulateIncomingMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  conversationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  customerPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  customerName?: string;
}

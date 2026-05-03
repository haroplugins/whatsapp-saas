import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ConversationDraftSource } from '@prisma/client';

export class UpsertConversationDraftDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsEnum(ConversationDraftSource)
  source?: ConversationDraftSource;
}

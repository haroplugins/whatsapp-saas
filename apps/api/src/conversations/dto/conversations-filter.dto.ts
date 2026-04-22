import { IsIn, IsOptional } from 'class-validator';

export class ConversationsFilterDto {
  @IsOptional()
  @IsIn(['business', 'personal'])
  type?: 'business' | 'personal';
}

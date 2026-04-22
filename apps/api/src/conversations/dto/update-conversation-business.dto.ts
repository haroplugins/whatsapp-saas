import { IsBoolean } from 'class-validator';

export class UpdateConversationBusinessDto {
  @IsBoolean()
  isBusiness!: boolean;
}

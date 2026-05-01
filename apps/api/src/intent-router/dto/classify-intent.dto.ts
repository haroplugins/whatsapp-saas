import { IsString, MinLength } from 'class-validator';

export class ClassifyIntentDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

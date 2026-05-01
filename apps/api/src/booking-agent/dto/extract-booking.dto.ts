import { IsString, MinLength } from 'class-validator';

export class ExtractBookingDto {
  @IsString()
  @MinLength(1)
  text!: string;
}

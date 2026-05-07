import { Transform } from 'class-transformer';
import { IsIn, IsString } from 'class-validator';

export const allowedBusinessCurrencies = [
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'CAD',
  'AUD',
  'MXN',
  'COP',
  'CLP',
  'ARS',
  'PEN',
  'BRL',
] as const;

export type BusinessCurrency = (typeof allowedBusinessCurrencies)[number];

export class UpdateBusinessSettingsDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsIn(allowedBusinessCurrencies)
  defaultCurrency!: BusinessCurrency;
}

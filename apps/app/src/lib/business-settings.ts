import { apiFetch } from './api';

export const businessCurrencyOptions = [
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'USD', label: 'USD - US Dollar' },
  { code: 'GBP', label: 'GBP - Pound Sterling' },
  { code: 'CHF', label: 'CHF - Swiss Franc' },
  { code: 'CAD', label: 'CAD - Canadian Dollar' },
  { code: 'AUD', label: 'AUD - Australian Dollar' },
  { code: 'MXN', label: 'MXN - Mexican Peso' },
  { code: 'COP', label: 'COP - Colombian Peso' },
  { code: 'CLP', label: 'CLP - Chilean Peso' },
  { code: 'ARS', label: 'ARS - Argentine Peso' },
  { code: 'PEN', label: 'PEN - Peruvian Sol' },
  { code: 'BRL', label: 'BRL - Brazilian Real' },
] as const;

export type BusinessCurrency = (typeof businessCurrencyOptions)[number]['code'];

export type BusinessSettings = {
  defaultCurrency: BusinessCurrency;
};

export type UpdateBusinessSettingsInput = {
  defaultCurrency: BusinessCurrency;
};

export function getBusinessSettings(): Promise<BusinessSettings> {
  return apiFetch<BusinessSettings>('/business/settings');
}

export function updateBusinessSettings(
  input: UpdateBusinessSettingsInput,
): Promise<BusinessSettings> {
  return apiFetch<BusinessSettings>('/business/settings', {
    method: 'PATCH',
    body: input,
  });
}

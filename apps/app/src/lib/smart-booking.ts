import { apiFetch } from './api';

export type SmartBookingMode =
  | 'SUGGEST_SLOTS'
  | 'REQUEST_CONFIRMATION'
  | 'AUTO_CONFIRM';

export type SmartBookingMissingInfoBehavior =
  | 'ASK_CLIENT'
  | 'HANDOFF_TO_HUMAN';

export type SmartBookingSettings = {
  enabled: boolean;
  mode: SmartBookingMode;
  maxSuggestions: number;
  missingInfoBehavior: SmartBookingMissingInfoBehavior;
  locked: boolean;
  canUseAutoBookingConfirm: boolean;
};

export type UpdateSmartBookingSettingsInput = Partial<
  Pick<
    SmartBookingSettings,
    'enabled' | 'mode' | 'maxSuggestions' | 'missingInfoBehavior'
  >
>;

export const defaultSmartBookingSettings: SmartBookingSettings = {
  enabled: false,
  mode: 'SUGGEST_SLOTS',
  maxSuggestions: 3,
  missingInfoBehavior: 'ASK_CLIENT',
  locked: true,
  canUseAutoBookingConfirm: false,
};

export function fetchSmartBookingSettings(): Promise<SmartBookingSettings> {
  return apiFetch<SmartBookingSettings>('/agenda/smart-booking-settings');
}

export function updateSmartBookingSettings(
  input: UpdateSmartBookingSettingsInput,
): Promise<SmartBookingSettings> {
  return apiFetch<SmartBookingSettings>('/agenda/smart-booking-settings', {
    method: 'PATCH',
    body: input,
  });
}

import { apiFetch } from './api';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';
export type AppointmentSource = 'MANUAL' | 'WHATSAPP' | 'AI' | 'IMPORT';

export type AgendaService = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  priceCents?: number | null;
  currency: string;
  bufferMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  tenantId: string;
  serviceId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlockedSlot = {
  id: string;
  tenantId: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookingSettings = {
  id: string;
  tenantId: string;
  timezone: string;
  minNoticeHours: number;
  maxDaysAhead: number;
  requireHumanConfirmation: boolean;
  allowAutoConfirm: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAgendaServiceInput = {
  name: string;
  durationMinutes: number;
  priceCents?: number;
  bufferMinutes?: number;
};

export type CreateAppointmentInput = {
  customerName: string;
  customerPhone?: string;
  serviceId: string;
  startAt: string;
  notes?: string;
};

export type CreateBlockedSlotInput = {
  startAt: string;
  endAt: string;
  reason?: string;
};

export function fetchAgendaServices(): Promise<AgendaService[]> {
  return apiFetch<AgendaService[]>('/agenda/services');
}

export function createAgendaService(
  input: CreateAgendaServiceInput,
): Promise<AgendaService> {
  return apiFetch<AgendaService>('/agenda/services', {
    method: 'POST',
    body: input,
  });
}

export function fetchAppointments(
  from: string,
  to: string,
): Promise<Appointment[]> {
  const params = new URLSearchParams({ from, to });
  return apiFetch<Appointment[]>(`/agenda/appointments?${params.toString()}`);
}

export function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>('/agenda/appointments', {
    method: 'POST',
    body: input,
  });
}

export function fetchBlockedSlots(): Promise<BlockedSlot[]> {
  return apiFetch<BlockedSlot[]>('/agenda/blocked-slots');
}

export function createBlockedSlot(
  input: CreateBlockedSlotInput,
): Promise<BlockedSlot> {
  return apiFetch<BlockedSlot>('/agenda/blocked-slots', {
    method: 'POST',
    body: input,
  });
}

export function fetchBookingSettings(): Promise<BookingSettings> {
  return apiFetch<BookingSettings>('/agenda/settings');
}

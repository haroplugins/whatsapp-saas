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

export type AvailabilityRule = {
  id: string;
  tenantId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityRuleInput = {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive?: boolean;
};

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  occupiedUntil: string;
  label: string;
};

export type SearchAvailabilityResponse = {
  date: string;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    bufferMinutes: number;
  };
  settings: {
    timezone: string;
    minNoticeHours: number;
    maxDaysAhead: number;
  };
  slots: AvailabilitySlot[];
  meta: {
    stepMinutes: number;
    weekday: number;
    rulesCount: number;
    appointmentsCount: number;
    blockedSlotsCount: number;
    reason?: 'NO_RULES' | 'OUT_OF_RANGE';
  };
};

export type SearchAvailabilityInput = {
  serviceId: string;
  date: string;
  stepMinutes?: number;
};

export type CreateAgendaServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  priceCents?: number;
  currency?: string;
  bufferMinutes?: number;
};

export type UpdateAgendaServiceInput = {
  name?: string;
  description?: string;
  durationMinutes?: number;
  priceCents?: number | null;
  currency?: string;
  bufferMinutes?: number;
  isActive?: boolean;
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

export type UpdateAppointmentInput = {
  customerName?: string;
  customerPhone?: string;
  serviceId?: string;
  startAt?: string;
  endAt?: string;
  status?: AppointmentStatus;
  notes?: string;
};

export type UpdateBlockedSlotInput = {
  startAt?: string;
  endAt?: string;
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

export function updateAgendaService(
  id: string,
  input: UpdateAgendaServiceInput,
): Promise<AgendaService> {
  return apiFetch<AgendaService>(`/agenda/services/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAgendaService(id: string): Promise<AgendaService> {
  return apiFetch<AgendaService>(`/agenda/services/${id}`, {
    method: 'DELETE',
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

export function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  return apiFetch<Appointment>(`/agenda/appointments/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function cancelAppointment(id: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/agenda/appointments/${id}`, {
    method: 'DELETE',
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

export function updateBlockedSlot(
  id: string,
  input: UpdateBlockedSlotInput,
): Promise<BlockedSlot> {
  return apiFetch<BlockedSlot>(`/agenda/blocked-slots/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteBlockedSlot(id: string): Promise<BlockedSlot> {
  return apiFetch<BlockedSlot>(`/agenda/blocked-slots/${id}`, {
    method: 'DELETE',
  });
}

export function fetchBookingSettings(): Promise<BookingSettings> {
  return apiFetch<BookingSettings>('/agenda/settings');
}

export function fetchAvailabilityRules(): Promise<AvailabilityRule[]> {
  return apiFetch<AvailabilityRule[]>('/agenda/availability-rules');
}

export function updateAvailabilityRules(
  rules: AvailabilityRuleInput[],
): Promise<AvailabilityRule[]> {
  return apiFetch<AvailabilityRule[]>('/agenda/availability-rules', {
    method: 'PUT',
    body: { rules },
  });
}

export function searchAgendaAvailability(
  input: SearchAvailabilityInput,
): Promise<SearchAvailabilityResponse> {
  return apiFetch<SearchAvailabilityResponse>('/agenda/availability/search', {
    method: 'POST',
    body: input,
  });
}

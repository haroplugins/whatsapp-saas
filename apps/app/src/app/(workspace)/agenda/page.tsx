'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  type AgendaService,
  type Appointment,
  type AvailabilityRule,
  type AvailabilityRuleInput,
  type BlockedSlot,
  type BookingSettings,
  type AppointmentStatus,
  cancelAppointment,
  createAgendaService,
  createAppointment,
  createBlockedSlot,
  deleteBlockedSlot,
  fetchAgendaServices,
  fetchAppointments,
  fetchAvailabilityRules,
  fetchBlockedSlots,
  fetchBookingSettings,
  updateAppointment,
  updateAvailabilityRules,
  updateBlockedSlot,
} from '../../../lib/agenda';
import {
  defaultTenantEntitlements,
  fetchTenantEntitlements,
  type TenantEntitlements,
} from '../../../lib/entitlements';

const monthOptions = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const weekdayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

type CalendarCell = {
  key: string;
  day: number | null;
};

type AvailabilityIntervalForm = {
  startTime: string;
  endTime: string;
};

type AvailabilityDayForm = {
  weekday: number;
  label: string;
  isActive: boolean;
  intervals: [AvailabilityIntervalForm, AvailabilityIntervalForm];
};

type DayActivityItem =
  | {
      id: string;
      kind: 'appointment';
      startAt: string;
      endAt: string;
      customerName: string;
      serviceName: string;
      status: string;
      appointment: Appointment;
    }
  | {
      id: string;
      kind: 'blocked-slot';
      startAt: string;
      endAt: string;
      reason: string;
      blockedSlot: BlockedSlot;
    };

const now = new Date();

const availabilityWeekdays = [
  { label: 'Lunes', weekday: 1 },
  { label: 'Martes', weekday: 2 },
  { label: 'Miercoles', weekday: 3 },
  { label: 'Jueves', weekday: 4 },
  { label: 'Viernes', weekday: 5 },
  { label: 'Sabado', weekday: 6 },
  { label: 'Domingo', weekday: 0 },
];

const appointmentStatusOptions: Array<{
  value: AppointmentStatus;
  label: string;
}> = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

export default function AgendaPage() {
  const [entitlements, setEntitlements] = useState<TenantEntitlements>(
    defaultTenantEntitlements,
  );
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [services, setServices] = useState<AgendaService[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<
    AvailabilityRule[]
  >([]);
  const [bookingSettings, setBookingSettings] =
    useState<BookingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState<
    AvailabilityDayForm[]
  >(() => buildDefaultAvailabilityForm());
  const [isQuickAppointmentModalOpen, setIsQuickAppointmentModalOpen] =
    useState(false);
  const [quickAppointmentServiceId, setQuickAppointmentServiceId] =
    useState('');
  const [quickAppointmentStartAt, setQuickAppointmentStartAt] = useState('');
  const [quickAppointmentCustomerName, setQuickAppointmentCustomerName] =
    useState('');
  const [quickAppointmentCustomerPhone, setQuickAppointmentCustomerPhone] =
    useState('');
  const [quickAppointmentNotes, setQuickAppointmentNotes] = useState('');
  const [quickAppointmentError, setQuickAppointmentError] = useState<
    string | null
  >(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [editAppointmentCustomerName, setEditAppointmentCustomerName] =
    useState('');
  const [editAppointmentCustomerPhone, setEditAppointmentCustomerPhone] =
    useState('');
  const [editAppointmentServiceId, setEditAppointmentServiceId] = useState('');
  const [editAppointmentStartAt, setEditAppointmentStartAt] = useState('');
  const [editAppointmentStatus, setEditAppointmentStatus] =
    useState<AppointmentStatus>('PENDING');
  const [editAppointmentNotes, setEditAppointmentNotes] = useState('');
  const [editAppointmentError, setEditAppointmentError] = useState<
    string | null
  >(null);
  const [editingBlockedSlotId, setEditingBlockedSlotId] = useState<
    string | null
  >(null);
  const [editBlockedSlotStartAt, setEditBlockedSlotStartAt] = useState('');
  const [editBlockedSlotEndAt, setEditBlockedSlotEndAt] = useState('');
  const [editBlockedSlotReason, setEditBlockedSlotReason] = useState('');
  const [editBlockedSlotError, setEditBlockedSlotError] = useState<
    string | null
  >(null);

  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('45');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceBuffer, setServiceBuffer] = useState('0');

  const [appointmentCustomerName, setAppointmentCustomerName] = useState('');
  const [appointmentCustomerPhone, setAppointmentCustomerPhone] = useState('');
  const [appointmentServiceId, setAppointmentServiceId] = useState('');
  const [selectedAvailabilityServiceId, setSelectedAvailabilityServiceId] =
    useState('');
  const [appointmentStartAt, setAppointmentStartAt] = useState(
    toDateTimeLocalValue(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0),
    ),
  );
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const [blockedStartAt, setBlockedStartAt] = useState(
    toDateTimeLocalValue(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0),
    ),
  );
  const [blockedEndAt, setBlockedEndAt] = useState(
    toDateTimeLocalValue(
      new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0),
    ),
  );
  const [blockedReason, setBlockedReason] = useState('');

  const canUseAgenda =
    entitlements.features.canUseAgenda &&
    entitlements.features.canUseManualAgenda;
  const selectedDate = useMemo(
    () => new Date(year, month, selectedDay),
    [month, selectedDay, year],
  );
  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services],
  );
  const calendarCells = useMemo(
    () => buildCalendarCells(year, month),
    [month, year],
  );
  const appointmentsByDay = useMemo(
    () => groupByMonthDay(appointments, 'startAt', year, month),
    [appointments, month, year],
  );
  const blockedSlotsByDay = useMemo(
    () => groupByMonthDay(blockedSlots, 'startAt', year, month),
    [blockedSlots, month, year],
  );
  const selectedAppointments = appointmentsByDay.get(selectedDay) ?? [];
  const selectedBlockedSlots = blockedSlotsByDay.get(selectedDay) ?? [];
  const selectedAvailabilityService = useMemo(
    () =>
      activeServices.find(
        (service) => service.id === selectedAvailabilityServiceId,
      ) ?? null,
    [activeServices, selectedAvailabilityServiceId],
  );
  const quickAppointmentService = useMemo(
    () =>
      activeServices.find(
        (service) => service.id === quickAppointmentServiceId,
      ) ?? null,
    [activeServices, quickAppointmentServiceId],
  );
  const editingAppointment = useMemo(
    () =>
      appointments.find(
        (appointment) => appointment.id === editingAppointmentId,
      ) ?? null,
    [appointments, editingAppointmentId],
  );
  const dayActivityItems = useMemo(
    () =>
      buildDayActivityItems(
        selectedAppointments,
        selectedBlockedSlots,
        services,
      ),
    [selectedAppointments, selectedBlockedSlots, services],
  );
  const availableSlots = useMemo(() => {
    if (!selectedAvailabilityService) {
      return [];
    }

    return calculateAvailableSlots({
      selectedDate,
      service: selectedAvailabilityService,
      availabilityRules,
      appointments: selectedAppointments,
      blockedSlots: selectedBlockedSlots,
      bookingSettings,
    });
  }, [
    availabilityRules,
    bookingSettings,
    selectedAppointments,
    selectedAvailabilityService,
    selectedBlockedSlots,
    selectedDate,
  ]);
  const hasAvailabilityRulesForSelectedDay = useMemo(
    () =>
      availabilityRules.some(
        (rule) =>
          rule.isActive && rule.weekday === getWeekdayForDate(selectedDate),
      ),
    [availabilityRules, selectedDate],
  );
  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - 2 + index);
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchTenantEntitlements()
      .then((nextEntitlements) => {
        if (isMounted) setEntitlements(nextEntitlements);
      })
      .catch(() => {
        if (isMounted) setEntitlements(defaultTenantEntitlements);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const daysInMonth = getDaysInMonth(year, month);
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [month, selectedDay, year]);

  useEffect(() => {
    if (!canUseAgenda) return;
    void loadAgendaData();
  }, [canUseAgenda, month, year]);

  useEffect(() => {
    const firstService = activeServices[0];
    if (!appointmentServiceId && firstService) {
      setAppointmentServiceId(firstService.id);
    }
  }, [activeServices, appointmentServiceId]);

  useEffect(() => {
    const firstService = activeServices[0];
    const selectedServiceStillExists = activeServices.some(
      (service) => service.id === selectedAvailabilityServiceId,
    );

    if (!selectedServiceStillExists) {
      setSelectedAvailabilityServiceId(firstService?.id ?? '');
    }
  }, [activeServices, selectedAvailabilityServiceId]);

  function selectDay(day: number) {
    const nextDate = new Date(year, month, day);
    setSelectedDay(day);
    setAppointmentStartAt(toDateTimeLocalValue(withTime(nextDate, 10, 0)));
    setBlockedStartAt(toDateTimeLocalValue(withTime(nextDate, 12, 0)));
    setBlockedEndAt(toDateTimeLocalValue(withTime(nextDate, 13, 0)));
  }

  function openAvailabilityModal() {
    setAvailabilityForm(buildAvailabilityForm(availabilityRules));
    setIsAvailabilityModalOpen(true);
  }

  function updateAvailabilityDay(weekday: number, isActive: boolean) {
    setAvailabilityForm((currentForm) =>
      currentForm.map((day) =>
        day.weekday === weekday
          ? {
              ...day,
              isActive,
            }
          : day,
      ),
    );
  }

  function updateAvailabilityInterval(
    weekday: number,
    intervalIndex: 0 | 1,
    field: keyof AvailabilityIntervalForm,
    value: string,
  ) {
    setAvailabilityForm((currentForm) =>
      currentForm.map((day) => {
        if (day.weekday !== weekday) {
          return day;
        }

        const intervals: [AvailabilityIntervalForm, AvailabilityIntervalForm] =
          [{ ...day.intervals[0] }, { ...day.intervals[1] }];
        intervals[intervalIndex] = {
          ...intervals[intervalIndex],
          [field]: value,
        };

        return {
          ...day,
          intervals,
        };
      }),
    );
  }

  async function loadAgendaData() {
    setIsLoading(true);
    setFeedback(null);

    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 1).toISOString();
      const [
        nextServices,
        nextAppointments,
        nextBlockedSlots,
        nextSettings,
        nextAvailabilityRules,
      ] = await Promise.all([
        fetchAgendaServices(),
        fetchAppointments(from, to),
        fetchBlockedSlots(),
        fetchBookingSettings(),
        fetchAvailabilityRules(),
      ]);

      setServices(nextServices);
      setAppointments(nextAppointments);
      setBlockedSlots(nextBlockedSlots);
      setBookingSettings(nextSettings);
      setAvailabilityRules(nextAvailabilityRules);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo cargar la agenda.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUseAgenda) return;

    try {
      const nextService = await createAgendaService({
        name: serviceName.trim(),
        durationMinutes: Number(serviceDuration),
        priceCents: servicePrice ? Number(servicePrice) : undefined,
        bufferMinutes: serviceBuffer ? Number(serviceBuffer) : undefined,
      });
      setServices((currentServices) => [nextService, ...currentServices]);
      setServiceName('');
      setServiceDuration('45');
      setServicePrice('');
      setServiceBuffer('0');
      setFeedback('Servicio creado.');
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo crear el servicio.',
      );
    }
  }

  async function handleCreateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUseAgenda || !appointmentServiceId) return;

    try {
      await createAppointment({
        customerName: appointmentCustomerName.trim(),
        customerPhone: appointmentCustomerPhone.trim() || undefined,
        serviceId: appointmentServiceId,
        startAt: new Date(appointmentStartAt).toISOString(),
        notes: appointmentNotes.trim() || undefined,
      });
      setAppointmentCustomerName('');
      setAppointmentCustomerPhone('');
      setAppointmentNotes('');
      setFeedback('Cita creada.');
      await loadAgendaData();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo crear la cita.',
      );
    }
  }

  async function handleCreateBlockedSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUseAgenda) return;

    try {
      await createBlockedSlot({
        startAt: new Date(blockedStartAt).toISOString(),
        endAt: new Date(blockedEndAt).toISOString(),
        reason: blockedReason.trim() || undefined,
      });
      setBlockedReason('');
      setFeedback('Bloqueo creado.');
      await loadAgendaData();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo crear el bloqueo.',
      );
    }
  }

  async function handleSaveAvailabilityRules() {
    if (!canUseAgenda) return;

    try {
      const rules = availabilityFormToRules(availabilityForm);
      const nextAvailabilityRules = await updateAvailabilityRules(rules);
      setAvailabilityRules(nextAvailabilityRules);
      setIsAvailabilityModalOpen(false);
      setFeedback('Horarios guardados.');
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los horarios.',
      );
    }
  }

  function selectAvailableSlot(slot: Date) {
    if (!selectedAvailabilityService) return;

    setQuickAppointmentServiceId(selectedAvailabilityService.id);
    setQuickAppointmentStartAt(toDateTimeLocalValue(slot));
    setQuickAppointmentCustomerName('');
    setQuickAppointmentCustomerPhone('');
    setQuickAppointmentNotes('');
    setQuickAppointmentError(null);
    setIsQuickAppointmentModalOpen(true);
  }

  function closeQuickAppointmentModal() {
    setIsQuickAppointmentModalOpen(false);
    setQuickAppointmentError(null);
  }

  async function handleCreateQuickAppointment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!canUseAgenda || !quickAppointmentServiceId) return;

    try {
      await createAppointment({
        customerName: quickAppointmentCustomerName.trim(),
        customerPhone: quickAppointmentCustomerPhone.trim() || undefined,
        serviceId: quickAppointmentServiceId,
        startAt: new Date(quickAppointmentStartAt).toISOString(),
        notes: quickAppointmentNotes.trim() || undefined,
      });
      setIsQuickAppointmentModalOpen(false);
      setQuickAppointmentCustomerName('');
      setQuickAppointmentCustomerPhone('');
      setQuickAppointmentNotes('');
      setQuickAppointmentError(null);
      setFeedback('Cita creada.');
      await loadAgendaData();
    } catch (error) {
      setQuickAppointmentError(
        error instanceof Error ? error.message : 'No se pudo crear la cita.',
      );
    }
  }

  function openEditAppointmentModal(appointment: Appointment) {
    setEditingAppointmentId(appointment.id);
    setEditAppointmentCustomerName(appointment.customerName);
    setEditAppointmentCustomerPhone(appointment.customerPhone ?? '');
    setEditAppointmentServiceId(
      appointment.serviceId ?? activeServices[0]?.id ?? '',
    );
    setEditAppointmentStartAt(
      toDateTimeLocalValue(new Date(appointment.startAt)),
    );
    setEditAppointmentStatus(appointment.status);
    setEditAppointmentNotes(appointment.notes ?? '');
    setEditAppointmentError(null);
  }

  function closeEditAppointmentModal() {
    setEditingAppointmentId(null);
    setEditAppointmentError(null);
  }

  async function handleUpdateAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAppointmentId) return;

    const service = services.find(
      (currentService) => currentService.id === editAppointmentServiceId,
    );
    const startAt = new Date(editAppointmentStartAt);
    const endAt = service
      ? addMinutes(startAt, service.durationMinutes)
      : editingAppointment
        ? new Date(editingAppointment.endAt)
        : startAt;

    try {
      await updateAppointment(editingAppointmentId, {
        customerName: editAppointmentCustomerName.trim(),
        customerPhone: editAppointmentCustomerPhone.trim() || undefined,
        serviceId: editAppointmentServiceId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        status: editAppointmentStatus,
        notes: editAppointmentNotes.trim() || undefined,
      });
      closeEditAppointmentModal();
      setFeedback('Cita actualizada.');
      await loadAgendaData();
    } catch (error) {
      setEditAppointmentError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la cita.',
      );
    }
  }

  async function updateAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
    successMessage: string,
  ) {
    try {
      await updateAppointment(appointmentId, { status });
      setFeedback(successMessage);
      await loadAgendaData();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la cita.',
      );
    }
  }

  async function handleCancelAppointment(appointmentId: string) {
    try {
      await cancelAppointment(appointmentId);
      setFeedback('Cita cancelada.');
      await loadAgendaData();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : 'No se pudo cancelar la cita.',
      );
    }
  }

  function openEditBlockedSlotModal(blockedSlot: BlockedSlot) {
    setEditingBlockedSlotId(blockedSlot.id);
    setEditBlockedSlotStartAt(
      toDateTimeLocalValue(new Date(blockedSlot.startAt)),
    );
    setEditBlockedSlotEndAt(toDateTimeLocalValue(new Date(blockedSlot.endAt)));
    setEditBlockedSlotReason(blockedSlot.reason ?? '');
    setEditBlockedSlotError(null);
  }

  function closeEditBlockedSlotModal() {
    setEditingBlockedSlotId(null);
    setEditBlockedSlotError(null);
  }

  async function handleUpdateBlockedSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBlockedSlotId) return;

    try {
      await updateBlockedSlot(editingBlockedSlotId, {
        startAt: new Date(editBlockedSlotStartAt).toISOString(),
        endAt: new Date(editBlockedSlotEndAt).toISOString(),
        reason: editBlockedSlotReason.trim() || undefined,
      });
      closeEditBlockedSlotModal();
      setFeedback('Bloqueo actualizado.');
      await loadAgendaData();
    } catch (error) {
      setEditBlockedSlotError(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el bloqueo.',
      );
    }
  }

  async function handleDeleteBlockedSlot(blockedSlotId: string) {
    if (!window.confirm('¿Eliminar este bloqueo?')) {
      return;
    }

    try {
      await deleteBlockedSlot(blockedSlotId);
      setFeedback('Bloqueo eliminado.');
      await loadAgendaData();
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'No se pudo eliminar el bloqueo.',
      );
    }
  }

  return (
    <section className="agenda-page">
      <div className="dashboard-hero">
        <div>
          <span className="workspace-header__eyebrow">Agenda</span>
          <h2>Agenda mensual</h2>
          <p>
            Gestiona servicios, citas manuales y bloqueos sin generar huecos
            libres todavia.
          </p>
        </div>
      </div>

      {!canUseAgenda ? (
        <section className="business-profile-card business-profile-card--page">
          <div className="feature-lock-banner" role="note">
            <span className="feature-lock-banner__badge">PRO</span>
            <div>
              <strong>Agenda manual disponible en plan Pro</strong>
              <p>
                Basic puede ver que el modulo existe, pero los servicios, citas
                y bloqueos se habilitan en Pro o Premium.
              </p>
            </div>
          </div>
          <div className="agenda-locked-preview" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="agenda-toolbar">
            <label className="business-form__field">
              <span>Mes</span>
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
              >
                {monthOptions.map((monthName, index) => (
                  <option key={monthName} value={index}>
                    {monthName}
                  </option>
                ))}
              </select>
            </label>
            <label className="business-form__field">
              <span>Ano</span>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
              >
                {yearOptions.map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button--ghost agenda-toolbar__settings"
              type="button"
              onClick={openAvailabilityModal}
            >
              Configurar horarios
            </button>
            <div className="agenda-toolbar__meta">
              <strong>{bookingSettings?.timezone ?? 'Europe/Madrid'}</strong>
              <span>
                {appointments.length} citas -{' '}
                {getMonthBlockedSlots(blockedSlots, year, month).length}{' '}
                bloqueos
              </span>
            </div>
          </section>

          {feedback ? <p className="form-error">{feedback}</p> : null}

          <section className="agenda-layout">
            <div className="agenda-calendar">
              {weekdayLabels.map((weekday) => (
                <span key={weekday} className="agenda-calendar__weekday">
                  {weekday}
                </span>
              ))}

              {calendarCells.map((cell) => {
                if (cell.day === null) {
                  return (
                    <span
                      key={cell.key}
                      className="agenda-day agenda-day--empty"
                    />
                  );
                }

                const day = cell.day;
                const dayAppointments = appointmentsByDay.get(day) ?? [];
                const dayBlockedSlots = blockedSlotsByDay.get(day) ?? [];
                const appointmentCount = dayAppointments.length;
                const blockedSlotCount = dayBlockedSlots.length;
                const appointmentSummary =
                  getAppointmentSummary(dayAppointments);

                return (
                  <button
                    key={cell.key}
                    className={`agenda-day${
                      day === selectedDay ? ' agenda-day--selected' : ''
                    }${
                      appointmentCount > 0
                        ? ' agenda-day--has-appointments'
                        : ''
                    }${blockedSlotCount > 0 ? ' agenda-day--has-blocks' : ''}`}
                    type="button"
                    onClick={() => selectDay(day)}
                  >
                    <strong>{day}</strong>
                    <span className="agenda-day__badge agenda-day__badge--appointments">
                      {formatAppointmentCount(appointmentCount)}
                    </span>
                    {blockedSlotCount > 0 ? (
                      <span className="agenda-day__badge agenda-day__badge--blocks">
                        {formatBlockedSlotCount(blockedSlotCount)}
                      </span>
                    ) : null}
                    {appointmentSummary ? (
                      <span className="agenda-day__summary">
                        {appointmentSummary}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <aside className="agenda-detail">
              <div className="agenda-detail__header">
                <span className="workspace-header__eyebrow">
                  Dia seleccionado
                </span>
                <h3>{formatDateLabel(selectedDate)}</h3>
              </div>

              <div className="agenda-list-block">
                <strong>Citas y bloqueos del dia</strong>
                {dayActivityItems.length > 0 ? (
                  dayActivityItems.map((item) => (
                    <article
                      key={`${item.kind}-${item.id}`}
                      className={`agenda-list-item agenda-list-item--${item.kind}`}
                    >
                      <span>{formatTimeRange(item.startAt, item.endAt)}</span>
                      {item.kind === 'appointment' ? (
                        <>
                          <strong>{item.customerName}</strong>
                          <small>
                            {item.serviceName} -{' '}
                            {formatAppointmentStatus(item.status)}
                          </small>
                          <div className="agenda-list-item__actions">
                            <button
                              className="agenda-list-action"
                              type="button"
                              onClick={() =>
                                openEditAppointmentModal(item.appointment)
                              }
                            >
                              Editar
                            </button>
                            {item.status === 'PENDING' ? (
                              <button
                                className="agenda-list-action"
                                type="button"
                                onClick={() =>
                                  updateAppointmentStatus(
                                    item.id,
                                    'CONFIRMED',
                                    'Cita confirmada.',
                                  )
                                }
                              >
                                Confirmar
                              </button>
                            ) : null}
                            {item.status === 'PENDING' ||
                            item.status === 'CONFIRMED' ? (
                              <button
                                className="agenda-list-action"
                                type="button"
                                onClick={() =>
                                  updateAppointmentStatus(
                                    item.id,
                                    'COMPLETED',
                                    'Cita completada.',
                                  )
                                }
                              >
                                Completar
                              </button>
                            ) : null}
                            {item.status !== 'CANCELLED' ? (
                              <button
                                className="agenda-list-action agenda-list-action--danger"
                                type="button"
                                onClick={() => handleCancelAppointment(item.id)}
                              >
                                Cancelar
                              </button>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>{item.reason}</strong>
                          <small>Bloqueo</small>
                          <div className="agenda-list-item__actions">
                            <button
                              className="agenda-list-action"
                              type="button"
                              onClick={() =>
                                openEditBlockedSlotModal(item.blockedSlot)
                              }
                            >
                              Editar
                            </button>
                            <button
                              className="agenda-list-action agenda-list-action--danger"
                              type="button"
                              onClick={() => handleDeleteBlockedSlot(item.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </>
                      )}
                    </article>
                  ))
                ) : (
                  <p>No hay citas ni bloqueos para este dia.</p>
                )}
              </div>

              <div className="agenda-availability-panel">
                <div className="agenda-list-block">
                  <strong>Disponibilidad</strong>
                  <label className="business-form__field">
                    <span>Consultar disponibilidad para</span>
                    <select
                      value={selectedAvailabilityServiceId}
                      disabled={activeServices.length === 0}
                      onChange={(event) =>
                        setSelectedAvailabilityServiceId(event.target.value)
                      }
                    >
                      {activeServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.durationMinutes} min
                        </option>
                      ))}
                    </select>
                  </label>

                  {activeServices.length === 0 ? (
                    <p>Crea un servicio antes de consultar disponibilidad.</p>
                  ) : !hasAvailabilityRulesForSelectedDay ? (
                    <p>No hay horario configurado para este dia.</p>
                  ) : availableSlots.length === 0 ? (
                    <p>No hay huecos disponibles para este servicio.</p>
                  ) : (
                    <div className="agenda-slot-grid">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.toISOString()}
                          className="agenda-slot-chip"
                          type="button"
                          onClick={() => selectAvailableSlot(slot)}
                          title="Crear cita en este hueco"
                        >
                          {formatShortTime(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </section>

          <section className="agenda-forms">
            <form
              className="business-profile-card"
              onSubmit={handleCreateService}
            >
              <div className="business-profile-card__header">
                <div>
                  <span className="workspace-header__eyebrow">Servicios</span>
                  <h3>Crear servicio</h3>
                </div>
              </div>
              <div className="business-form">
                <label className="business-form__field">
                  <span>Nombre</span>
                  <input
                    required
                    type="text"
                    value={serviceName}
                    onChange={(event) => setServiceName(event.target.value)}
                  />
                </label>
                <label className="business-form__field">
                  <span>Duracion minutos</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={serviceDuration}
                    onChange={(event) => setServiceDuration(event.target.value)}
                  />
                </label>
                <label className="business-form__field">
                  <span>Precio centimos</span>
                  <input
                    min="0"
                    type="number"
                    value={servicePrice}
                    onChange={(event) => setServicePrice(event.target.value)}
                  />
                </label>
                <label className="business-form__field">
                  <span>Buffer minutos</span>
                  <input
                    min="0"
                    type="number"
                    value={serviceBuffer}
                    onChange={(event) => setServiceBuffer(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="button button--primary"
                type="submit"
                disabled={isLoading}
              >
                Crear servicio
              </button>
            </form>

            <form
              className="business-profile-card"
              onSubmit={handleCreateAppointment}
            >
              <div className="business-profile-card__header">
                <div>
                  <span className="workspace-header__eyebrow">Citas</span>
                  <h3>Crear cita manual</h3>
                </div>
              </div>
              <div className="business-form">
                <label className="business-form__field">
                  <span>Cliente</span>
                  <input
                    required
                    type="text"
                    value={appointmentCustomerName}
                    onChange={(event) =>
                      setAppointmentCustomerName(event.target.value)
                    }
                  />
                </label>
                <label className="business-form__field">
                  <span>Telefono</span>
                  <input
                    type="text"
                    value={appointmentCustomerPhone}
                    onChange={(event) =>
                      setAppointmentCustomerPhone(event.target.value)
                    }
                  />
                </label>
                <label className="business-form__field">
                  <span>Servicio</span>
                  <select
                    required
                    value={appointmentServiceId}
                    onChange={(event) =>
                      setAppointmentServiceId(event.target.value)
                    }
                  >
                    {activeServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMinutes} min
                      </option>
                    ))}
                  </select>
                </label>
                <label className="business-form__field">
                  <span>Fecha y hora</span>
                  <input
                    required
                    type="datetime-local"
                    value={appointmentStartAt}
                    onChange={(event) =>
                      setAppointmentStartAt(event.target.value)
                    }
                  />
                </label>
                <label className="business-form__field business-form__field--full">
                  <span>Notas</span>
                  <textarea
                    value={appointmentNotes}
                    onChange={(event) =>
                      setAppointmentNotes(event.target.value)
                    }
                  />
                </label>
              </div>
              <button
                className="button button--primary"
                type="submit"
                disabled={isLoading || activeServices.length === 0}
              >
                Crear cita
              </button>
              {activeServices.length === 0 ? (
                <p className="config-conflict-note">
                  Crea un servicio antes de registrar citas manuales.
                </p>
              ) : null}
            </form>

            <form
              className="business-profile-card"
              onSubmit={handleCreateBlockedSlot}
            >
              <div className="business-profile-card__header">
                <div>
                  <span className="workspace-header__eyebrow">Bloqueos</span>
                  <h3>Crear bloqueo</h3>
                </div>
              </div>
              <div className="business-form">
                <label className="business-form__field">
                  <span>Inicio</span>
                  <input
                    required
                    type="datetime-local"
                    value={blockedStartAt}
                    onChange={(event) => setBlockedStartAt(event.target.value)}
                  />
                </label>
                <label className="business-form__field">
                  <span>Fin</span>
                  <input
                    required
                    type="datetime-local"
                    value={blockedEndAt}
                    onChange={(event) => setBlockedEndAt(event.target.value)}
                  />
                </label>
                <label className="business-form__field business-form__field--full">
                  <span>Motivo</span>
                  <input
                    type="text"
                    value={blockedReason}
                    onChange={(event) => setBlockedReason(event.target.value)}
                  />
                </label>
              </div>
              <button
                className="button button--primary"
                type="submit"
                disabled={isLoading}
              >
                Crear bloqueo
              </button>
            </form>
          </section>
        </>
      )}

      {isAvailabilityModalOpen ? (
        <div
          className="availability-modal-backdrop"
          role="presentation"
          onClick={() => setIsAvailabilityModalOpen(false)}
        >
          <section
            className="availability-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="availability-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="availability-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Agenda</span>
                <h3 id="availability-modal-title">Configurar horarios</h3>
                <p>
                  Define el horario semanal base. Estos tramos se usaran mas
                  adelante para calcular horas libres.
                </p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
              >
                Cerrar
              </button>
            </div>

            <div className="availability-modal__body">
              <div className="availability-week-grid">
                {availabilityForm.map((day) => (
                  <article
                    key={day.weekday}
                    className={`availability-day-card${
                      day.isActive ? ' availability-day-card--active' : ''
                    }`}
                  >
                    <label className="availability-day-card__toggle">
                      <input
                        type="checkbox"
                        checked={day.isActive}
                        onChange={(event) =>
                          updateAvailabilityDay(
                            day.weekday,
                            event.target.checked,
                          )
                        }
                      />
                      <strong>{day.label}</strong>
                      <span>{day.isActive ? 'Activo' : 'Cerrado'}</span>
                    </label>

                    <div className="availability-day-card__slots">
                      <label>
                        <span>Tramo 1 inicio</span>
                        <input
                          type="time"
                          value={day.intervals[0].startTime}
                          disabled={!day.isActive}
                          onChange={(event) =>
                            updateAvailabilityInterval(
                              day.weekday,
                              0,
                              'startTime',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        <span>Tramo 1 fin</span>
                        <input
                          type="time"
                          value={day.intervals[0].endTime}
                          disabled={!day.isActive}
                          onChange={(event) =>
                            updateAvailabilityInterval(
                              day.weekday,
                              0,
                              'endTime',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        <span>Tramo 2 inicio</span>
                        <input
                          type="time"
                          value={day.intervals[1].startTime}
                          disabled={!day.isActive}
                          onChange={(event) =>
                            updateAvailabilityInterval(
                              day.weekday,
                              1,
                              'startTime',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label>
                        <span>Tramo 2 fin</span>
                        <input
                          type="time"
                          value={day.intervals[1].endTime}
                          disabled={!day.isActive}
                          onChange={(event) =>
                            updateAvailabilityInterval(
                              day.weekday,
                              1,
                              'endTime',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="availability-preview">
                <strong>Vista previa</strong>
                <div>
                  {availabilityForm.map((day) => (
                    <span key={day.weekday}>
                      {formatAvailabilityPreview(day)}
                    </span>
                  ))}
                </div>
              </aside>
            </div>

            <div className="availability-modal__footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setIsAvailabilityModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="button button--primary"
                type="button"
                onClick={handleSaveAvailabilityRules}
              >
                Guardar horarios
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {isQuickAppointmentModalOpen ? (
        <div
          className="quick-appointment-modal-backdrop"
          role="presentation"
          onClick={closeQuickAppointmentModal}
        >
          <form
            className="quick-appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-appointment-modal-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleCreateQuickAppointment}
          >
            <div className="quick-appointment-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Agenda</span>
                <h3 id="quick-appointment-modal-title">Crear cita</h3>
                <p>
                  Confirma el servicio y la hora elegida antes de registrar la
                  cita.
                </p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={closeQuickAppointmentModal}
              >
                Cerrar
              </button>
            </div>

            <div className="quick-appointment-modal__body">
              {quickAppointmentError ? (
                <p className="form-error">{quickAppointmentError}</p>
              ) : null}

              <div className="business-form">
                <label className="business-form__field">
                  <span>Servicio</span>
                  <select
                    required
                    value={quickAppointmentServiceId}
                    onChange={(event) =>
                      setQuickAppointmentServiceId(event.target.value)
                    }
                  >
                    {activeServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMinutes} min
                      </option>
                    ))}
                  </select>
                  {quickAppointmentService ? (
                    <small>
                      Duracion {quickAppointmentService.durationMinutes} min
                      {quickAppointmentService.bufferMinutes > 0
                        ? ` + buffer ${quickAppointmentService.bufferMinutes} min`
                        : ''}
                    </small>
                  ) : null}
                </label>

                <label className="business-form__field">
                  <span>Fecha y hora</span>
                  <input
                    required
                    type="datetime-local"
                    value={quickAppointmentStartAt}
                    onChange={(event) =>
                      setQuickAppointmentStartAt(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Cliente</span>
                  <input
                    required
                    type="text"
                    value={quickAppointmentCustomerName}
                    onChange={(event) =>
                      setQuickAppointmentCustomerName(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Telefono</span>
                  <input
                    type="text"
                    value={quickAppointmentCustomerPhone}
                    onChange={(event) =>
                      setQuickAppointmentCustomerPhone(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field business-form__field--full">
                  <span>Notas</span>
                  <textarea
                    value={quickAppointmentNotes}
                    onChange={(event) =>
                      setQuickAppointmentNotes(event.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="quick-appointment-modal__footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={closeQuickAppointmentModal}
              >
                Cancelar
              </button>
              <button className="button button--primary" type="submit">
                Crear cita
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editingAppointmentId ? (
        <div
          className="quick-appointment-modal-backdrop"
          role="presentation"
          onClick={closeEditAppointmentModal}
        >
          <form
            className="quick-appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-appointment-modal-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleUpdateAppointment}
          >
            <div className="quick-appointment-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Agenda</span>
                <h3 id="edit-appointment-modal-title">Editar cita</h3>
                <p>Actualiza los datos de la cita y su estado.</p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={closeEditAppointmentModal}
              >
                Cerrar
              </button>
            </div>

            <div className="quick-appointment-modal__body">
              {editAppointmentError ? (
                <p className="form-error">{editAppointmentError}</p>
              ) : null}

              <div className="business-form">
                <label className="business-form__field">
                  <span>Cliente</span>
                  <input
                    required
                    type="text"
                    value={editAppointmentCustomerName}
                    onChange={(event) =>
                      setEditAppointmentCustomerName(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Telefono</span>
                  <input
                    type="text"
                    value={editAppointmentCustomerPhone}
                    onChange={(event) =>
                      setEditAppointmentCustomerPhone(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Servicio</span>
                  <select
                    required
                    value={editAppointmentServiceId}
                    onChange={(event) =>
                      setEditAppointmentServiceId(event.target.value)
                    }
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - {service.durationMinutes} min
                      </option>
                    ))}
                  </select>
                </label>

                <label className="business-form__field">
                  <span>Fecha y hora</span>
                  <input
                    required
                    type="datetime-local"
                    value={editAppointmentStartAt}
                    onChange={(event) =>
                      setEditAppointmentStartAt(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Estado</span>
                  <select
                    value={editAppointmentStatus}
                    onChange={(event) =>
                      setEditAppointmentStatus(
                        event.target.value as AppointmentStatus,
                      )
                    }
                  >
                    {appointmentStatusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="business-form__field business-form__field--full">
                  <span>Notas</span>
                  <textarea
                    value={editAppointmentNotes}
                    onChange={(event) =>
                      setEditAppointmentNotes(event.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="quick-appointment-modal__footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={closeEditAppointmentModal}
              >
                Cancelar
              </button>
              <button className="button button--primary" type="submit">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {editingBlockedSlotId ? (
        <div
          className="quick-appointment-modal-backdrop"
          role="presentation"
          onClick={closeEditBlockedSlotModal}
        >
          <form
            className="quick-appointment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-blocked-slot-modal-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleUpdateBlockedSlot}
          >
            <div className="quick-appointment-modal__header">
              <div>
                <span className="workspace-header__eyebrow">Agenda</span>
                <h3 id="edit-blocked-slot-modal-title">Editar bloqueo</h3>
                <p>Ajusta el horario o motivo del bloqueo.</p>
              </div>
              <button
                className="button button--ghost"
                type="button"
                onClick={closeEditBlockedSlotModal}
              >
                Cerrar
              </button>
            </div>

            <div className="quick-appointment-modal__body">
              {editBlockedSlotError ? (
                <p className="form-error">{editBlockedSlotError}</p>
              ) : null}

              <div className="business-form">
                <label className="business-form__field">
                  <span>Inicio</span>
                  <input
                    required
                    type="datetime-local"
                    value={editBlockedSlotStartAt}
                    onChange={(event) =>
                      setEditBlockedSlotStartAt(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field">
                  <span>Fin</span>
                  <input
                    required
                    type="datetime-local"
                    value={editBlockedSlotEndAt}
                    onChange={(event) =>
                      setEditBlockedSlotEndAt(event.target.value)
                    }
                  />
                </label>

                <label className="business-form__field business-form__field--full">
                  <span>Motivo</span>
                  <input
                    type="text"
                    value={editBlockedSlotReason}
                    onChange={(event) =>
                      setEditBlockedSlotReason(event.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="quick-appointment-modal__footer">
              <button
                className="button button--ghost"
                type="button"
                onClick={closeEditBlockedSlotModal}
              >
                Cancelar
              </button>
              <button className="button button--primary" type="submit">
                Guardar bloqueo
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = getDaysInMonth(year, month);
  const leadingEmptyDays = (firstDay.getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < leadingEmptyDays; index += 1) {
    cells.push({ key: `empty-start-${index}`, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ key: `day-${day}`, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, day: null });
  }

  return cells;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function buildDayActivityItems(
  appointments: Appointment[],
  blockedSlots: BlockedSlot[],
  services: AgendaService[],
): DayActivityItem[] {
  const appointmentItems: DayActivityItem[] = appointments.map(
    (appointment) => ({
      id: appointment.id,
      kind: 'appointment',
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      customerName: appointment.customerName,
      serviceName: getServiceName(appointment.serviceId, services),
      status: appointment.status,
      appointment,
    }),
  );
  const blockedSlotItems: DayActivityItem[] = blockedSlots.map(
    (blockedSlot) => ({
      id: blockedSlot.id,
      kind: 'blocked-slot',
      startAt: blockedSlot.startAt,
      endAt: blockedSlot.endAt,
      reason: blockedSlot.reason || 'Bloqueo manual',
      blockedSlot,
    }),
  );

  return [...appointmentItems, ...blockedSlotItems].sort(
    (firstItem, secondItem) =>
      new Date(firstItem.startAt).getTime() -
      new Date(secondItem.startAt).getTime(),
  );
}

function calculateAvailableSlots({
  selectedDate,
  service,
  availabilityRules,
  appointments,
  blockedSlots,
  bookingSettings,
}: {
  selectedDate: Date;
  service: AgendaService;
  availabilityRules: AvailabilityRule[];
  appointments: Appointment[];
  blockedSlots: BlockedSlot[];
  bookingSettings: BookingSettings | null;
}): Date[] {
  if (!isWithinMaxDaysAhead(selectedDate, bookingSettings)) {
    return [];
  }

  const weekday = getWeekdayForDate(selectedDate);
  const dayRules = availabilityRules
    .filter((rule) => rule.isActive && rule.weekday === weekday)
    .sort(
      (firstRule, secondRule) =>
        timeToMinutes(firstRule.startTime) -
        timeToMinutes(secondRule.startTime),
    );
  const occupiedIntervals = [
    ...appointments
      .filter((appointment) => appointment.status !== 'CANCELLED')
      .map((appointment) => ({
        start: new Date(appointment.startAt),
        end: new Date(appointment.endAt),
      })),
    ...blockedSlots.map((blockedSlot) => ({
      start: new Date(blockedSlot.startAt),
      end: new Date(blockedSlot.endAt),
    })),
  ];
  const earliestAllowedStart = getEarliestAllowedStart(
    selectedDate,
    bookingSettings,
  );

  return dayRules.flatMap((rule) =>
    buildCandidateTimesForRule(rule, selectedDate).filter((candidateStart) => {
      const candidateEnd = addMinutes(candidateStart, service.durationMinutes);
      const occupiedEndForCheck = addMinutes(
        candidateEnd,
        service.bufferMinutes,
      );
      const ruleEnd = buildDateWithTime(selectedDate, rule.endTime);

      if (candidateEnd > ruleEnd) {
        return false;
      }

      if (candidateStart < earliestAllowedStart) {
        return false;
      }

      return occupiedIntervals.every(
        (interval) =>
          !intervalsOverlap(
            candidateStart,
            occupiedEndForCheck,
            interval.start,
            interval.end,
          ),
      );
    }),
  );
}

function buildCandidateTimesForRule(
  rule: AvailabilityRule,
  selectedDate: Date,
  stepMinutes = 15,
): Date[] {
  const candidates: Date[] = [];
  const ruleStart = buildDateWithTime(selectedDate, rule.startTime);
  const ruleEnd = buildDateWithTime(selectedDate, rule.endTime);

  for (
    let candidate = ruleStart;
    candidate < ruleEnd;
    candidate = addMinutes(candidate, stepMinutes)
  ) {
    candidates.push(candidate);
  }

  return candidates;
}

function getWeekdayForDate(date: Date): number {
  return date.getDay();
}

function getEarliestAllowedStart(
  selectedDate: Date,
  bookingSettings: BookingSettings | null,
): Date {
  const startOfSelectedDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    0,
    0,
    0,
    0,
  );
  const minimumNoticeDate = addMinutes(
    new Date(),
    (bookingSettings?.minNoticeHours ?? 0) * 60,
  );

  return minimumNoticeDate > startOfSelectedDay
    ? minimumNoticeDate
    : startOfSelectedDay;
}

function isWithinMaxDaysAhead(
  selectedDate: Date,
  bookingSettings: BookingSettings | null,
): boolean {
  if (!bookingSettings) {
    return true;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const selectedDateStart = new Date(selectedDate);
  selectedDateStart.setHours(0, 0, 0, 0);
  const maxDate = addMinutes(
    todayStart,
    bookingSettings.maxDaysAhead * 24 * 60,
  );

  return selectedDateStart <= maxDate;
}

function intervalsOverlap(
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date,
): boolean {
  return startA < endB && endA > startB;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function buildDateWithTime(date: Date, time: string): Date {
  const [hours = '0', minutes = '0'] = time.split(':');
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hours),
    Number(minutes),
    0,
    0,
  );
}

function buildDefaultAvailabilityForm(): AvailabilityDayForm[] {
  return availabilityWeekdays.map(({ label, weekday }) => {
    if (weekday === 0) {
      return {
        weekday,
        label,
        isActive: false,
        intervals: [
          { startTime: '', endTime: '' },
          { startTime: '', endTime: '' },
        ],
      };
    }

    if (weekday === 6) {
      return {
        weekday,
        label,
        isActive: true,
        intervals: [
          { startTime: '09:00', endTime: '13:00' },
          { startTime: '', endTime: '' },
        ],
      };
    }

    return {
      weekday,
      label,
      isActive: true,
      intervals: [
        { startTime: '09:00', endTime: '13:00' },
        { startTime: '16:00', endTime: '20:00' },
      ],
    };
  });
}

function buildAvailabilityForm(
  availabilityRules: AvailabilityRule[],
): AvailabilityDayForm[] {
  if (availabilityRules.length === 0) {
    return buildDefaultAvailabilityForm();
  }

  return availabilityWeekdays.map(({ label, weekday }) => {
    const dayRules = availabilityRules
      .filter((rule) => rule.weekday === weekday && rule.isActive)
      .sort(
        (firstRule, secondRule) =>
          timeToMinutes(firstRule.startTime) -
          timeToMinutes(secondRule.startTime),
      )
      .slice(0, 2);

    return {
      weekday,
      label,
      isActive: dayRules.length > 0,
      intervals: [
        {
          startTime: dayRules[0]?.startTime ?? '',
          endTime: dayRules[0]?.endTime ?? '',
        },
        {
          startTime: dayRules[1]?.startTime ?? '',
          endTime: dayRules[1]?.endTime ?? '',
        },
      ],
    };
  });
}

function availabilityFormToRules(
  availabilityForm: AvailabilityDayForm[],
): AvailabilityRuleInput[] {
  return availabilityForm.flatMap((day) => {
    if (!day.isActive) {
      return [];
    }

    const rules = day.intervals.flatMap((interval) => {
      const hasStartTime = interval.startTime.length > 0;
      const hasEndTime = interval.endTime.length > 0;

      if (hasStartTime !== hasEndTime) {
        throw new Error(`${day.label}: completa inicio y fin del tramo.`);
      }

      if (!hasStartTime || !hasEndTime) {
        return [];
      }

      if (
        timeToMinutes(interval.startTime) >= timeToMinutes(interval.endTime)
      ) {
        throw new Error(`${day.label}: el inicio debe ser anterior al fin.`);
      }

      return [
        {
          weekday: day.weekday,
          startTime: interval.startTime,
          endTime: interval.endTime,
          isActive: true,
        },
      ];
    });

    if (rules.length === 0) {
      throw new Error(`${day.label}: anade al menos un tramo o marca cerrado.`);
    }

    validateDayIntervalsDoNotOverlap(day.label, rules);

    return rules;
  });
}

function validateDayIntervalsDoNotOverlap(
  dayLabel: string,
  rules: AvailabilityRuleInput[],
): void {
  const sortedRules = [...rules].sort(
    (firstRule, secondRule) =>
      timeToMinutes(firstRule.startTime) - timeToMinutes(secondRule.startTime),
  );

  for (let index = 1; index < sortedRules.length; index += 1) {
    const previousRule = sortedRules[index - 1];
    const currentRule = sortedRules[index];

    if (
      previousRule &&
      currentRule &&
      timeToMinutes(currentRule.startTime) < timeToMinutes(previousRule.endTime)
    ) {
      throw new Error(`${dayLabel}: los tramos no pueden solaparse.`);
    }
  }
}

function formatAvailabilityPreview(day: AvailabilityDayForm): string {
  if (!day.isActive) {
    return `${day.label}: cerrado`;
  }

  const intervals = day.intervals
    .filter((interval) => interval.startTime && interval.endTime)
    .map((interval) => `${interval.startTime}-${interval.endTime}`);

  if (intervals.length === 0) {
    return `${day.label}: sin tramos`;
  }

  return `${day.label}: ${intervals.join(' / ')}`;
}

function timeToMinutes(value: string): number {
  const [hours = '0', minutes = '0'] = value.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function groupByMonthDay<T extends Appointment | BlockedSlot>(
  items: T[],
  dateKey: keyof Pick<T, 'startAt'>,
  year: number,
  month: number,
): Map<number, T[]> {
  const groupedItems = new Map<number, T[]>();

  items.forEach((item) => {
    const date = new Date(String(item[dateKey]));

    if (date.getFullYear() !== year || date.getMonth() !== month) {
      return;
    }

    const day = date.getDate();
    groupedItems.set(day, [...(groupedItems.get(day) ?? []), item]);
  });

  return groupedItems;
}

function getMonthBlockedSlots(
  blockedSlots: BlockedSlot[],
  year: number,
  month: number,
): BlockedSlot[] {
  return blockedSlots.filter((blockedSlot) => {
    const date = new Date(blockedSlot.startAt);
    return date.getFullYear() === year && date.getMonth() === month;
  });
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function withTime(date: Date, hours: number, minutes: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
  );
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'full',
  }).format(date);
}

function formatTimeRange(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

function formatAppointmentCount(appointmentCount: number): string {
  if (appointmentCount === 0) {
    return 'Sin citas';
  }

  if (appointmentCount === 1) {
    return '1 cita';
  }

  return `${appointmentCount} citas`;
}

function formatBlockedSlotCount(blockedSlotCount: number): string {
  if (blockedSlotCount === 1) {
    return '1 bloqueo';
  }

  return `${blockedSlotCount} bloqueos`;
}

function formatAppointmentStatus(status: string): string {
  if (status === 'CONFIRMED') return 'Confirmada';
  if (status === 'CANCELLED') return 'Cancelada';
  if (status === 'COMPLETED') return 'Completada';
  return 'Pendiente';
}

function getAppointmentSummary(dayAppointments: Appointment[]): string | null {
  if (dayAppointments.length === 0) {
    return null;
  }

  const sortedAppointments = [...dayAppointments].sort(
    (firstAppointment, secondAppointment) =>
      new Date(firstAppointment.startAt).getTime() -
      new Date(secondAppointment.startAt).getTime(),
  );
  const firstAppointment = sortedAppointments[0];
  const lastAppointment = sortedAppointments[sortedAppointments.length - 1];

  if (!firstAppointment || !lastAppointment) {
    return null;
  }

  if (sortedAppointments.length === 1) {
    return `Primera: ${formatShortTime(firstAppointment.startAt)}`;
  }

  return `${formatShortTime(firstAppointment.startAt)} - ${formatShortTime(
    lastAppointment.startAt,
  )}`;
}

function formatShortTime(value: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value instanceof Date ? value : new Date(value));
}

function getServiceName(
  serviceId: string | null | undefined,
  services: AgendaService[],
): string {
  return (
    services.find((service) => service.id === serviceId)?.name ??
    'Servicio manual'
  );
}

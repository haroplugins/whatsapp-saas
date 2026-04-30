import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Appointment,
  AppointmentSource,
  AppointmentStatus,
  Service,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AvailabilityService } from './availability.service';
import { AppointmentsFilterDto } from './dto/appointments-filter.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async listByTenant(
    tenantId: string,
    appointmentsFilterDto: AppointmentsFilterDto,
  ): Promise<Appointment[]> {
    return this.prismaService.appointment.findMany({
      where: {
        tenantId,
        ...(appointmentsFilterDto.status
          ? { status: appointmentsFilterDto.status }
          : {}),
        ...(appointmentsFilterDto.from || appointmentsFilterDto.to
          ? {
              startAt: {
                ...(appointmentsFilterDto.from
                  ? { gte: parseDate(appointmentsFilterDto.from, 'from') }
                  : {}),
                ...(appointmentsFilterDto.to
                  ? { lte: parseDate(appointmentsFilterDto.to, 'to') }
                  : {}),
              },
            }
          : {}),
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  async create(
    tenantId: string,
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const startAt = parseDate(createAppointmentDto.startAt, 'startAt');
    const service = createAppointmentDto.serviceId
      ? await this.getServiceById(tenantId, createAppointmentDto.serviceId)
      : null;
    const endAt = createAppointmentDto.endAt
      ? parseDate(createAppointmentDto.endAt, 'endAt')
      : calculateEndAt(startAt, service);
    const status = createAppointmentDto.status ?? AppointmentStatus.PENDING;

    ensureStartBeforeEnd(startAt, endAt);

    if (service && isActiveAppointmentStatus(status)) {
      await this.availabilityService.assertAppointmentSlotAvailable({
        tenantId,
        serviceId: service.id,
        startAt,
        endAt,
      });
    }

    return this.prismaService.appointment.create({
      data: {
        tenantId,
        serviceId: service?.id,
        customerName: createAppointmentDto.customerName,
        customerPhone: createAppointmentDto.customerPhone,
        startAt,
        endAt,
        status,
        source: createAppointmentDto.source ?? AppointmentSource.MANUAL,
        notes: createAppointmentDto.notes,
      },
    });
  }

  async update(
    tenantId: string,
    appointmentId: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appointment = await this.getById(tenantId, appointmentId);
    const hasStartAtChange = updateAppointmentDto.startAt !== undefined;
    const hasServiceChange = updateAppointmentDto.serviceId !== undefined;
    const finalServiceId =
      updateAppointmentDto.serviceId ?? appointment.serviceId;
    const service = finalServiceId
      ? await this.getServiceById(tenantId, finalServiceId)
      : null;
    const startAt = updateAppointmentDto.startAt
      ? parseDate(updateAppointmentDto.startAt, 'startAt')
      : appointment.startAt;
    const endAt = updateAppointmentDto.endAt
      ? parseDate(updateAppointmentDto.endAt, 'endAt')
      : service && (hasStartAtChange || hasServiceChange)
        ? calculateEndAt(startAt, service)
        : appointment.endAt;
    const status = updateAppointmentDto.status ?? appointment.status;

    ensureStartBeforeEnd(startAt, endAt);

    if (service && isActiveAppointmentStatus(status)) {
      await this.availabilityService.assertAppointmentSlotAvailable({
        tenantId,
        serviceId: service.id,
        startAt,
        endAt,
        appointmentIdToIgnore: appointmentId,
      });
    }

    return this.prismaService.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        serviceId:
          updateAppointmentDto.serviceId !== undefined
            ? service?.id
            : undefined,
        customerName: updateAppointmentDto.customerName,
        customerPhone: updateAppointmentDto.customerPhone,
        startAt: updateAppointmentDto.startAt ? startAt : undefined,
        endAt: updateAppointmentDto.endAt ? endAt : undefined,
        status: updateAppointmentDto.status,
        source: updateAppointmentDto.source,
        notes: updateAppointmentDto.notes,
      },
    });
  }

  async remove(tenantId: string, appointmentId: string): Promise<Appointment> {
    await this.getById(tenantId, appointmentId);

    return this.prismaService.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        status: AppointmentStatus.CANCELLED,
      },
    });
  }

  private async getById(
    tenantId: string,
    appointmentId: string,
  ): Promise<Appointment> {
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        id: appointmentId,
        tenantId,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found.');
    }

    return appointment;
  }

  private async getServiceById(
    tenantId: string,
    serviceId: string,
  ): Promise<Service> {
    const service = await this.prismaService.service.findFirst({
      where: {
        id: serviceId,
        tenantId,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found.');
    }

    return service;
  }
}

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date.`);
  }

  return date;
}

function calculateEndAt(startAt: Date, service: Service | null): Date {
  if (!service) {
    throw new BadRequestException(
      'endAt is required when serviceId is not provided.',
    );
  }

  return new Date(startAt.getTime() + service.durationMinutes * 60 * 1000);
}

function ensureStartBeforeEnd(startAt: Date, endAt: Date): void {
  if (startAt >= endAt) {
    throw new BadRequestException('startAt must be before endAt.');
  }
}

function isActiveAppointmentStatus(status: AppointmentStatus): boolean {
  return status !== AppointmentStatus.CANCELLED;
}

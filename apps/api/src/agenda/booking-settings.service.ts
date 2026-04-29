import { Injectable } from '@nestjs/common';
import { BookingSettings } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBookingSettingsDto } from './dto/update-booking-settings.dto';

@Injectable()
export class BookingSettingsService {
  constructor(private readonly prismaService: PrismaService) {}

  getOrCreate(tenantId: string): Promise<BookingSettings> {
    return this.prismaService.bookingSettings.upsert({
      where: { tenantId },
      update: {},
      create: { tenantId },
    });
  }

  update(
    tenantId: string,
    updateBookingSettingsDto: UpdateBookingSettingsDto,
  ): Promise<BookingSettings> {
    return this.prismaService.bookingSettings.upsert({
      where: { tenantId },
      update: updateBookingSettingsDto,
      create: {
        tenantId,
        ...updateBookingSettingsDto,
      },
    });
  }
}

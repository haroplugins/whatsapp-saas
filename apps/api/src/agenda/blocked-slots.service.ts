import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlockedSlot } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';
import { UpdateBlockedSlotDto } from './dto/update-blocked-slot.dto';

@Injectable()
export class BlockedSlotsService {
  constructor(private readonly prismaService: PrismaService) {}

  listByTenant(tenantId: string): Promise<BlockedSlot[]> {
    return this.prismaService.blockedSlot.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        startAt: 'asc',
      },
    });
  }

  create(
    tenantId: string,
    createBlockedSlotDto: CreateBlockedSlotDto,
  ): Promise<BlockedSlot> {
    const startAt = parseDate(createBlockedSlotDto.startAt, 'startAt');
    const endAt = parseDate(createBlockedSlotDto.endAt, 'endAt');
    ensureStartBeforeEnd(startAt, endAt);

    return this.prismaService.blockedSlot.create({
      data: {
        tenantId,
        startAt,
        endAt,
        reason: createBlockedSlotDto.reason,
      },
    });
  }

  async update(
    tenantId: string,
    blockedSlotId: string,
    updateBlockedSlotDto: UpdateBlockedSlotDto,
  ): Promise<BlockedSlot> {
    const blockedSlot = await this.getById(tenantId, blockedSlotId);
    const startAt = updateBlockedSlotDto.startAt
      ? parseDate(updateBlockedSlotDto.startAt, 'startAt')
      : blockedSlot.startAt;
    const endAt = updateBlockedSlotDto.endAt
      ? parseDate(updateBlockedSlotDto.endAt, 'endAt')
      : blockedSlot.endAt;

    ensureStartBeforeEnd(startAt, endAt);

    return this.prismaService.blockedSlot.update({
      where: {
        id: blockedSlotId,
      },
      data: {
        startAt: updateBlockedSlotDto.startAt ? startAt : undefined,
        endAt: updateBlockedSlotDto.endAt ? endAt : undefined,
        reason: updateBlockedSlotDto.reason,
      },
    });
  }

  async remove(tenantId: string, blockedSlotId: string): Promise<BlockedSlot> {
    await this.getById(tenantId, blockedSlotId);

    return this.prismaService.blockedSlot.delete({
      where: {
        id: blockedSlotId,
      },
    });
  }

  private async getById(
    tenantId: string,
    blockedSlotId: string,
  ): Promise<BlockedSlot> {
    const blockedSlot = await this.prismaService.blockedSlot.findFirst({
      where: {
        id: blockedSlotId,
        tenantId,
      },
    });

    if (!blockedSlot) {
      throw new NotFoundException('Blocked slot not found.');
    }

    return blockedSlot;
  }
}

function parseDate(value: string, fieldName: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid date.`);
  }

  return date;
}

function ensureStartBeforeEnd(startAt: Date, endAt: Date): void {
  if (startAt >= endAt) {
    throw new BadRequestException('startAt must be before endAt.');
  }
}

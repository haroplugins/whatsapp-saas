import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const STARTUP_RETENTION_DELAY_MS = 60 * 1000;
const DEFAULT_DRAFT_RETENTION_DAYS = 7;
const DEFAULT_DRY_RUN_LOG_RETENTION_DAYS = 14;

@Injectable()
export class DataRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DataRetentionService.name);
  private startupTimeout?: ReturnType<typeof setTimeout>;
  private retentionInterval?: ReturnType<typeof setInterval>;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  onModuleInit(): void {
    this.startupTimeout = setTimeout(() => {
      void this.runRetention('startup');
    }, STARTUP_RETENTION_DELAY_MS);

    this.retentionInterval = setInterval(() => {
      void this.runRetention('scheduled');
    }, DAY_MS);
  }

  onModuleDestroy(): void {
    if (this.startupTimeout) {
      clearTimeout(this.startupTimeout);
    }

    if (this.retentionInterval) {
      clearInterval(this.retentionInterval);
    }
  }

  private async runRetention(reason: string): Promise<void> {
    const draftRetentionDays = this.getRetentionDays(
      'CONVERSATION_DRAFT_RETENTION_DAYS',
      DEFAULT_DRAFT_RETENTION_DAYS,
    );
    const dryRunLogRetentionDays = this.getRetentionDays(
      'BOOKING_DRY_RUN_LOG_RETENTION_DAYS',
      DEFAULT_DRY_RUN_LOG_RETENTION_DAYS,
    );
    const now = Date.now();
    const draftCutoff = new Date(now - draftRetentionDays * DAY_MS);
    const dryRunLogCutoff = new Date(now - dryRunLogRetentionDays * DAY_MS);

    try {
      // Drafts and dry-run logs can contain customer-provided text. Keep only
      // the short operational window needed for human review and debugging.
      const [draftResult, dryRunLogResult] =
        await this.prismaService.$transaction([
          this.prismaService.conversationDraft.deleteMany({
            where: {
              updatedAt: {
                lt: draftCutoff,
              },
            },
          }),
          this.prismaService.bookingAgentDryRunLog.deleteMany({
            where: {
              createdAt: {
                lt: dryRunLogCutoff,
              },
            },
          }),
        ]);

      this.logger.log(
        `Retention ${reason}: deleted ${draftResult.count} ConversationDraft older than ${draftRetentionDays} days and ${dryRunLogResult.count} BookingAgentDryRunLog older than ${dryRunLogRetentionDays} days.`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Retention ${reason} failed: ${getErrorMessage(error)}`,
      );
    }
  }

  private getRetentionDays(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      return fallback;
    }

    return parsed;
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

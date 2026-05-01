import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { IntentRouterController } from './intent-router.controller';
import { IntentRouterService } from './intent-router.service';

@Module({
  imports: [AuthModule],
  controllers: [IntentRouterController],
  providers: [IntentRouterService],
  exports: [IntentRouterService],
})
export class IntentRouterModule {}

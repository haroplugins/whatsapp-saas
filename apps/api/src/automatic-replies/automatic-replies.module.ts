import { Module } from '@nestjs/common';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { AutomaticReplyPolicyService } from './automatic-reply-policy.service';

@Module({
  imports: [EntitlementsModule],
  providers: [AutomaticReplyPolicyService],
  exports: [AutomaticReplyPolicyService],
})
export class AutomaticRepliesModule {}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClassifyIntentDto } from './dto/classify-intent.dto';
import { IntentRouterService } from './intent-router.service';

@Controller('intent-router')
@UseGuards(JwtAuthGuard)
export class IntentRouterController {
  constructor(private readonly intentRouterService: IntentRouterService) {}

  @Post('classify')
  classify(@Body() classifyIntentDto: ClassifyIntentDto) {
    return this.intentRouterService.classify(classifyIntentDto.text);
  }
}

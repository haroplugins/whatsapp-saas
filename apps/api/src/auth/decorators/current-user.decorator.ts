import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { CurrentUserDto } from '../dto/current-user.dto';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUserDto => {
    const request = context.switchToHttp().getRequest<{ user: CurrentUserDto }>();
    return request.user;
  },
);

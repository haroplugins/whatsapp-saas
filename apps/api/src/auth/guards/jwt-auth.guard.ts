import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUserDto } from '../dto/current-user.dto';

type RequestWithAuth = {
  headers?: {
    authorization?: string;
  };
  user?: CurrentUserDto;
};

type JwtPayload = {
  userId?: string;
  tenantId?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      if (!payload.userId || !payload.tenantId) {
        throw new UnauthorizedException('Invalid token payload.');
      }

      request.user = {
        userId: payload.userId,
        tenantId: payload.tenantId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid token.');
    }
  }

  private extractTokenFromHeader(request: RequestWithAuth): string | undefined {
    const authorization = request.headers?.authorization;

    if (!authorization) {
      return undefined;
    }

    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

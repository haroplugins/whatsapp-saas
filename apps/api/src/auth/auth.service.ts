import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email is already in use.');
    }

    const fullName = registerDto.fullName.trim();
    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prismaService.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: this.buildTenantName(fullName, email),
        },
      });

      return tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          passwordHash,
          fullName,
        },
      });
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const email = this.normalizeEmail(loginDto.email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.buildAuthResponse(user);
  }

  async getMe(currentUser: CurrentUserDto): Promise<MeResponseDto> {
    const user = await this.usersService.findById(currentUser.userId);

    if (!user || user.tenantId !== currentUser.tenantId) {
      throw new UnauthorizedException('Invalid token.');
    }

    return {
      userId: currentUser.userId,
      tenantId: currentUser.tenantId,
      email: user.email,
    };
  }

  private async buildAuthResponse(user: {
    id: string;
    tenantId: string;
    email: string;
    fullName: string;
  }): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      userId: user.id,
      tenantId: user.tenantId,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        fullName: user.fullName,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private buildTenantName(fullName: string, email: string): string {
    if (fullName.length > 0) {
      return `${fullName}'s Workspace`;
    }

    const emailName = email.split('@')[0] ?? 'workspace';
    return `${emailName}'s Workspace`;
  }
}

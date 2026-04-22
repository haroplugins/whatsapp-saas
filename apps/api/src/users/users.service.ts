import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prismaService.user.findUnique({
      where: {
        id,
      },
    });
  }
}

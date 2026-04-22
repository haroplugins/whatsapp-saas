export class AuthResponseDto {
  accessToken!: string;
  user!: {
    id: string;
    tenantId: string;
    email: string;
    fullName: string;
  };
}

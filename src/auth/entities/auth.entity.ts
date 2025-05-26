import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../interfaces';

export class Auth {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for authentication',
  })
  token: string;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message indicating the result of the operation',
  })
  message: string;

  @ApiProperty({
    example: Role.SALESPERSON,
    description: 'User role in the system',
    enum: Role,
  })
  role: Role;
}

import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponse {
  @ApiProperty({
    description: 'Status message for the logout operation',
    example: 'Successfully logged out',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of when the logout occurred',
    example: new Date().toISOString(),
    type: String,
    format: 'date-time',
  })
  logoutTime: string;
}

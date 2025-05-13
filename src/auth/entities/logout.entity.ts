import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponse {
  @ApiProperty({
    description: 'Result message',
    example: 'Successfully logged out',
  })
  message: string;
}

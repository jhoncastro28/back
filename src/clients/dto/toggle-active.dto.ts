import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Toggle Active Data Transfer Object
 * 
 * DTO for activating or deactivating a client in the system.
 * This operation can only be performed by administrators.
 */
export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description: 'Active or inactive status of the client (true = active, false = inactive)',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}

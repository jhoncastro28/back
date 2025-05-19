import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Toggle Active Data Transfer Object
 *
 * Common DTO for activating or deactivating entities in the system.
 * This operation is typically restricted to administrators.
 */
export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description:
      'Active or inactive status of the entity (true = active, false = inactive)',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}

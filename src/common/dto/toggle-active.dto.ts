import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Toggle Active Data Transfer Object
 *
 * Common DTO for activating or deactivating entities in the system.
 * This operation is typically restricted to administrators.
 *
 * @example
 * {
 *   "isActive": false
 * }
 *
 * Usage:
 * - Use for any entity that needs activation/deactivation functionality
 * - Commonly used with users, clients, products, etc.
 * - Supports both boolean values and string representations ('true'/'false')
 */
export class ToggleActiveDto {
  /**
   * Active status flag
   *
   * @example true
   * @example false
   * @default true
   */
  @ApiProperty({
    example: false,
    description:
      'Active or inactive status of the entity (true = active, false = inactive)',
    default: true,
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive must be a boolean value (true/false)' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}

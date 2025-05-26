import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Toggle Active Client Data Transfer Object
 *
 * This DTO is used to activate or deactivate a client account:
 * - true: activates the client account
 * - false: deactivates the client account (soft delete)
 * - Used in admin operations to manage client access
 */
export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description:
      'Set to true to activate the client account, false to deactivate it',
    type: Boolean,
    required: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean value (true/false)' })
  @IsNotEmpty({ message: 'isActive status is required' })
  isActive: boolean;
}

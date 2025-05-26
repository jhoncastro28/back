import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object for toggling user active status
 *
 * This DTO is used to activate or deactivate a user account:
 * - true: activates the user account
 * - false: deactivates the user account (soft delete)
 */
export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description:
      'Set to true to activate the user account, false to deactivate it',
    type: Boolean,
    required: true,
  })
  @IsBoolean({ message: 'isActive must be a boolean value (true/false)' })
  @IsNotEmpty({ message: 'isActive status is required' })
  isActive: boolean;
}

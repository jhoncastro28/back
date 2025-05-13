import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class ToggleActiveDto {
  @ApiProperty({
    example: false,
    description: 'Active or inactive status of the user',
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsNotEmpty({ message: 'isActive is required' })
  isActive: boolean;
}

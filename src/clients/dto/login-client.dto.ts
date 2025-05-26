import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DocumentType } from '../entities/client.entity';

/**
 * Login Client Data Transfer Object
 *
 * This DTO validates client login credentials with the following features:
 * - Document type validation (CC or TI)
 * - Document number format validation
 * - Required fields validation
 * - Length restrictions
 */
export class LoginClientDto {
  @ApiProperty({
    example: DocumentType.CC,
    description: 'Type of identification document',
    enum: DocumentType,
    enumName: 'DocumentType',
  })
  @IsEnum(DocumentType, {
    message: `Document type must be one of: ${Object.values(DocumentType).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Document type is required' })
  documentType: DocumentType;

  @ApiProperty({
    example: '1234567890',
    description: 'Identification document number',
    minLength: 6,
    maxLength: 20,
    pattern: '^[0-9]+$',
  })
  @IsString({ message: 'Document number must be a string' })
  @IsNotEmpty({ message: 'Document number is required' })
  @Matches(/^[0-9]+$/, { message: 'Document number must contain only digits' })
  @MinLength(6, {
    message: 'Document number must be at least 6 characters long',
  })
  @MaxLength(20, { message: 'Document number cannot exceed 20 characters' })
  documentNumber: string;
}

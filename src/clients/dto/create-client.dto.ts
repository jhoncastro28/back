import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DocumentType } from '../entities/client.entity';

/**
 * Create Client Data Transfer Object
 *
 * This DTO validates and transfers client creation data with the following features:
 * - Required fields: name
 * - Optional fields: email, phoneNumber, address, documentType, documentNumber
 * - Strong validation rules for all fields
 * - Proper format validation for email and phone number
 * - Length restrictions for text fields
 */
export class CreateClientDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the client',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address for client communications',
    format: 'email',
    maxLength: 100,
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(100, { message: 'Email cannot exceed 100 characters' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Contact phone number in international format',
    pattern: '^\+?[1-9]\d{1,14}$',
  })
  @IsString({ message: 'Phone number must be a string' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Phone number must be in international format (e.g., +573001234567)',
  })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    description: 'Physical address for deliveries or contact',
    maxLength: 200,
  })
  @IsString({ message: 'Address must be a string' })
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: DocumentType.CC,
    description: 'Type of identification document',
    enum: DocumentType,
    enumName: 'DocumentType',
  })
  @IsEnum(DocumentType, {
    message: `Document type must be one of: ${Object.values(DocumentType).join(', ')}`,
  })
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Identification document number',
    minLength: 6,
    maxLength: 20,
    pattern: '^[0-9]+$',
  })
  @IsString({ message: 'Document number must be a string' })
  @Matches(/^[0-9]+$/, { message: 'Document number must contain only digits' })
  @MinLength(6, {
    message: 'Document number must be at least 6 characters long',
  })
  @MaxLength(20, { message: 'Document number cannot exceed 20 characters' })
  @IsOptional()
  documentNumber?: string;
}

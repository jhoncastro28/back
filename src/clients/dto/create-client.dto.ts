import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../entities/client.entity';

/**
 * Create Client Data Transfer Object
 *
 * DTO for validating client creation requests.
 * Contains all fields necessary to create a new client
 * with appropriate validation rules.
 */
export class CreateClientDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the client',
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address of the client for communication',
  })
  @IsEmail({}, { message: 'Email format is not valid' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    example: '+1 555-123-4567',
    description: 'Contact phone number of the client',
  })
  @IsString({ message: 'Phone number must be a string' })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City',
    description: 'Physical address of the client',
  })
  @IsString({ message: 'Address must be a string' })
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: 'CC',
    description:
      'Type of identification document (CC: Cédula de Ciudadanía, TI: Tarjeta de Identidad)',
    enum: DocumentType,
  })
  @IsEnum(DocumentType, { message: 'Document type must be either CC or TI' })
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Identification document number unique to the client',
  })
  @IsString({ message: 'Document number must be a string' })
  @IsOptional()
  documentNumber?: string;
}

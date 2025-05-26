import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
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
import { DocumentType } from '../../../generated/prisma';

export class CreateSupplierDto {
  @ApiProperty({
    description: 'Legal name of the supplier company',
    example: 'Tech Supplies Inc.',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    description: 'Name of the primary contact person at the supplier company',
    example: 'John Smith',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Contact name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Contact name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Business email address for supplier communications',
    example: 'contact@techsupplies.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact phone number including country code',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s-()]{8,}$/, {
    message: 'Please provide a valid phone number',
  })
  @Transform(({ value }) => value?.trim())
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Complete business address of the supplier',
    example: '123 Business Ave, Suite 100, New York, NY 10001',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Address cannot exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({
    description: 'Type of legal identification document',
    enum: DocumentType,
    enumName: 'DocumentType',
    example: DocumentType.CC,
  })
  @IsOptional()
  @IsEnum(DocumentType, {
    message: 'Document type must be one of the valid types',
  })
  documentType?: DocumentType;

  @ApiPropertyOptional({
    description: 'Legal identification number based on document type',
    example: '1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Document number cannot exceed 20 characters' })
  @Transform(({ value }) => value?.trim())
  documentNumber?: string;
}

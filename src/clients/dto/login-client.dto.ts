import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentType } from '../entities/client.entity';

export class LoginClientDto {
  @ApiProperty({
    example: 'CC',
    description: 'Document type (CC, TI)',
    enum: DocumentType,
  })
  @IsEnum(DocumentType, { message: 'Document type must be valid' })
  @IsNotEmpty({ message: 'Document type is required' })
  documentType: DocumentType;

  @ApiProperty({
    example: '1234567890',
    description: 'Document number',
  })
  @IsString({ message: 'Document number must be a string' })
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber: string;
}

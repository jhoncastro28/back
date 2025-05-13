import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Document Type Enumeration
 *
 * Represents the types of identification documents
 * accepted for clients in Colombia.
 *
 * - CC: Cédula de Ciudadanía (National ID for citizens)
 * - TI: Tarjeta de Identidad (ID card for minors)
 */
export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
}

/**
 * Client Entity
 *
 * Represents the data structure of a client
 * in the system. Contains all details about a client
 * including personal information and status.
 */
export class Client {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the client',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the client',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address of the client for communication',
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+1 555-123-4567',
    description: 'Contact phone number of the client',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City',
    description: 'Physical address of the client',
  })
  address?: string;

  @ApiPropertyOptional({
    example: 'CC',
    description:
      'Type of identification document (CC: Cédula de Ciudadanía, TI: Tarjeta de Identidad)',
    enum: DocumentType,
  })
  documentType?: DocumentType;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Identification document number unique to the client',
  })
  documentNumber?: string;

  @ApiProperty({
    example: true,
    description:
      'Indicates whether the client is active in the system (true) or not (false)',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Timestamp when the client record was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Timestamp when the client record was last updated',
  })
  updatedAt: Date;
}

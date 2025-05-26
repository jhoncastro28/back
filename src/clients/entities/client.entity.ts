import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Document Type Enumeration
 *
 * Represents the types of identification documents
 * accepted for clients in Colombia:
 *
 * - CC: Cédula de Ciudadanía (National ID for citizens)
 * - TI: Tarjeta de Identidad (ID card for minors)
 */
export enum DocumentType {
  CC = 'CC', // Cédula de Ciudadanía
  TI = 'TI', // Tarjeta de Identidad
}

/**
 * Client Entity
 *
 * Represents a client in the system with all their attributes and metadata.
 * This entity is used for both database representation and API responses.
 * Contains personal information, contact details, and system metadata.
 */
export class Client {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the client record',
    type: Number,
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the client',
    minLength: 2,
    maxLength: 100,
  })
  name: string;

  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address for client communications',
    format: 'email',
    maxLength: 100,
  })
  email?: string;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'Contact phone number in international format',
    pattern: '^\+?[1-9]\d{1,14}$',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Calle 123 #45-67, Bogotá, Colombia',
    description: 'Physical address for deliveries or contact',
    maxLength: 200,
  })
  address?: string;

  @ApiPropertyOptional({
    example: DocumentType.CC,
    description: 'Type of identification document',
    enum: DocumentType,
    enumName: 'DocumentType',
  })
  documentType?: DocumentType;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Identification document number',
    minLength: 6,
    maxLength: 20,
    pattern: '^[0-9]+$',
  })
  documentNumber?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the client account is currently active',
    type: Boolean,
  })
  isActive: boolean;

  @ApiProperty({
    example: 0,
    description: 'Total number of purchases made by the client',
    type: Number,
    minimum: 0,
  })
  purchaseCount: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Timestamp of when the client record was created',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Timestamp of when the client record was last updated',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Client Response
 *
 * Response entity for operations that return a single client
 */
export class ClientResponse {
  @ApiProperty({
    example: 'Client operation completed successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    description: 'Client information',
    type: Client,
  })
  client: Client;
}

/**
 * Clients List Response
 *
 * Response entity for operations that return multiple clients
 */
export class ClientsResponse {
  @ApiProperty({
    example: 'Clients retrieved successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    type: [Client],
    description: 'Array of client objects',
  })
  clients: Client[];
}

/**
 * Paginated Clients Response
 *
 * Response entity for paginated client listing operations
 * Includes metadata for pagination handling
 */
export class PaginatedClientsResponse {
  @ApiProperty({
    example: 'Clients retrieved successfully',
    description: 'Status message for the operation',
  })
  message: string;

  @ApiProperty({
    type: [Client],
    description: 'Array of client objects for the current page',
  })
  data: Client[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false,
    },
    type: 'object',
    properties: {
      total: {
        type: 'number',
        description: 'Total number of clients across all pages',
      },
      page: {
        type: 'number',
        description: 'Current page number',
      },
      limit: {
        type: 'number',
        description: 'Number of items per page',
      },
      totalPages: {
        type: 'number',
        description: 'Total number of pages',
      },
      hasNextPage: {
        type: 'boolean',
        description: 'Whether there is a next page available',
      },
      hasPreviousPage: {
        type: 'boolean',
        description: 'Whether there is a previous page available',
      },
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

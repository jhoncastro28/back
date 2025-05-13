import { ApiProperty } from '@nestjs/swagger';
import { Client } from './client.entity';

export * from './client.entity';

export class ClientResponse {
  @ApiProperty({
    description: 'Response message',
    example: 'Client found successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Client data',
    type: Client,
  })
  client: Client;
}

export class PaginatedClientsResponse {
  @ApiProperty({
    description: 'Response message',
    example: 'Clients retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of clients',
    type: [Client],
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

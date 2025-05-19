import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class QueryParamsDto {
  @ApiProperty({
    description: 'SQL query to be executed on the client side',
    example: 'SELECT * FROM inventory WHERE status = "Critical"',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Parameters for the query',
    example: { status: 'Critical', minStock: 10 },
    required: false,
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;

  @ApiProperty({
    description: 'Metadata for client processing',
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

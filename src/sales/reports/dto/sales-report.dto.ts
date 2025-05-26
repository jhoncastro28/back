import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

export enum ReportGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export enum SalesReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum GroupBy {
  PRODUCT = 'product',
  CLIENT = 'client',
  USER = 'user',
  DATE = 'date',
}

export class SalesReportFilterDto {
  @ApiPropertyOptional({
    description: 'Start date for the report period',
    example: '2024-01-01',
    type: Date,
  })
  @IsOptional()
  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for the report period',
    example: '2024-03-15',
    type: Date,
  })
  @IsOptional()
  @Transform(({ value }) => value && new Date(value))
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class SalesReportResponseDto {
  @ApiProperty({
    description: 'Total number of sales in the period',
    example: 150,
  })
  totalSales: number;

  @ApiProperty({
    description: 'Total revenue in the period',
    example: 15000.5,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Total number of products sold',
    example: 300,
  })
  productsSold: number;

  @ApiProperty({
    description: 'Average sale value',
    example: 100.0,
  })
  averageSaleValue: number;

  @ApiProperty({
    description: 'Number of unique clients who made purchases',
    example: 45,
  })
  uniqueClients: number;

  @ApiProperty({
    description: 'Report period information',
    example: {
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-12-31T23:59:59Z',
    },
  })
  period: {
    startDate: Date;
    endDate: Date;
  };
}

export class SalesReportQueryDto extends SalesReportFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by client ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  clientId?: number;

  @ApiPropertyOptional({
    description: 'Filter by user (salesperson) ID',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Minimum sale amount to include',
    example: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Maximum sale amount to include',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'How to group the sales data',
    enum: GroupBy,
    example: GroupBy.PRODUCT,
  })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;

  @ApiPropertyOptional({
    description: 'Whether to generate a full report without pagination',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  generateFullReport?: boolean = false;
}

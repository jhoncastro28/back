import { IsDate, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SaleFilterDto {
  @ApiProperty({ description: 'Page number', example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({
    description: 'Client ID for filtering',
    example: 1,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  clientId?: number;
}

export class SaleReportDateFilterDto {
  @ApiProperty({
    description: 'Start date for filtering',
    example: '2024-01-01',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({
    description: 'End date for filtering',
    example: '2024-12-31',
    required: false,
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}

export class SalesGroupByDto extends SaleReportDateFilterDto {
  @ApiProperty({
    description: 'Group by period',
    enum: ['day', 'week', 'month'],
    default: 'day',
    required: false,
  })
  @IsEnum(['day', 'week', 'month'])
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month';
}

export class TopItemsFilterDto extends SaleReportDateFilterDto {
  @ApiProperty({
    description: 'Limit number of results',
    example: 10,
    required: false,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

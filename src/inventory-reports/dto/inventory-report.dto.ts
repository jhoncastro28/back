import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReportType {
  GENERAL = 'general',
  BY_CATEGORY = 'by_category',
  CRITICAL = 'critical',
}

export enum ReportFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
}

export class GenerateReportDto {
  @ApiProperty({
    description: 'Type of inventory report',
    enum: ReportType,
    default: ReportType.GENERAL,
  })
  @IsEnum(ReportType)
  reportType: ReportType = ReportType.GENERAL;

  @ApiProperty({
    description: 'Format of the report file',
    enum: ReportFormat,
    default: ReportFormat.XLSX,
  })
  @IsEnum(ReportFormat)
  format: ReportFormat = ReportFormat.XLSX;

  @ApiProperty({
    description: 'Supplier ID to filter by (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({
    description: 'Start date for report range (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for report range (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

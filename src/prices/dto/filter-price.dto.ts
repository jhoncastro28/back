import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FilterPriceDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Product ID must be an integer' })
  @Min(1, { message: 'Product ID must be at least 1' })
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by current price status',
    example: true,
  })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isCurrentPrice?: boolean;
}

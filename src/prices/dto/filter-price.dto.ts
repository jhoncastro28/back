import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PRICE_CONSTANTS } from './price.constants';

export class FilterPriceDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by product ID',
    example: 1,
    minimum: PRICE_CONSTANTS.MIN_PRODUCT_ID,
  })
  @Type(() => Number)
  @IsInt({ message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_ID.INT })
  @Min(PRICE_CONSTANTS.MIN_PRODUCT_ID, {
    message: PRICE_CONSTANTS.VALIDATION_MESSAGES.PRODUCT_ID.MIN,
  })
  @IsOptional()
  productId?: number;

  @ApiPropertyOptional({
    description: 'Filter by current price status',
    example: true,
  })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isCurrentPrice?: boolean;
}

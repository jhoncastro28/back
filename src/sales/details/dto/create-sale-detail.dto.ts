import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Min } from 'class-validator';

export class CreateSaleDetailDto {
  @ApiProperty({
    description: 'ID of the sale this detail belongs to',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  saleId: number;

  @ApiProperty({
    description: 'ID of the product being sold',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiProperty({
    description: 'Quantity of the product being sold',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;
}

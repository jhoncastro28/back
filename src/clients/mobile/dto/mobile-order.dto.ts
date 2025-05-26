import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class MobileOrderDto extends PaginationDto {
  @ApiProperty({
    description: 'Client ID',
    example: 1,
    required: true,
  })
  @IsNumber()
  clientId: number;

  @ApiProperty({
    description: 'Order ID',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  orderId?: number;
}

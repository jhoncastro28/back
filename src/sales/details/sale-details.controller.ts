import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../../generated/prisma';
import { Roles } from '../../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards';
import {
  CreateSaleDetailDto,
  FilterSaleDetailDto,
  UpdateSaleDetailDto,
} from './dto';
import {
  PaginatedSaleDetailResponse,
  SaleDetailResponse,
} from './dto/sale-detail-response.dto';
import { SaleDetailsService } from './sale-details.service';

@ApiTags('Sale Details')
@Controller('sale-details')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
@ApiBearerAuth()
export class SaleDetailsController {
  constructor(private readonly saleDetailsService: SaleDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale detail' })
  @ApiResponse({
    status: 201,
    description: 'The sale detail has been successfully created.',
    type: SaleDetailResponse,
  })
  create(
    @Body() createSaleDetailDto: CreateSaleDetailDto,
  ): Promise<SaleDetailResponse> {
    return this.saleDetailsService.create(createSaleDetailDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sale details with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of sale details.',
    type: PaginatedSaleDetailResponse,
  })
  findAll(
    @Query() filters: FilterSaleDetailDto,
  ): Promise<PaginatedSaleDetailResponse> {
    return this.saleDetailsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a sale detail by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a single sale detail.',
    type: SaleDetailResponse,
  })
  findOne(@Param('id') id: string): Promise<SaleDetailResponse> {
    return this.saleDetailsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sale detail' })
  @ApiResponse({
    status: 200,
    description: 'The sale detail has been successfully updated.',
    type: SaleDetailResponse,
  })
  update(
    @Param('id') id: string,
    @Body() updateSaleDetailDto: UpdateSaleDetailDto,
  ): Promise<SaleDetailResponse> {
    return this.saleDetailsService.update(+id, updateSaleDetailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sale detail' })
  @ApiResponse({
    status: 200,
    description: 'The sale detail has been successfully deleted.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.saleDetailsService.remove(+id);
  }
}

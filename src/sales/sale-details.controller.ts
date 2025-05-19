import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SaleDetailsService } from './sale-details.service';
import {
  CreateSaleDetailDto,
  UpdateSaleDetailDto,
  SaleDetailResponseDto,
} from './dto/sale-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../../generated/prisma';

@ApiTags('sale-details')
@Controller('sale-details')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SaleDetailsController {
  constructor(private readonly saleDetailsService: SaleDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale detail' })
  @ApiResponse({
    status: 201,
    description: 'Sale detail created successfully',
    type: SaleDetailResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Roles(Role.ADMINISTRATOR)
  async create(@Body() createSaleDetailDto: CreateSaleDetailDto) {
    return this.saleDetailsService.create(createSaleDetailDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale detail by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the sale detail',
    type: SaleDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sale detail not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.saleDetailsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a sale detail' })
  @ApiResponse({
    status: 200,
    description: 'Sale detail updated successfully',
    type: SaleDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Sale detail not found' })
  @Roles(Role.ADMINISTRATOR)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSaleDetailDto: UpdateSaleDetailDto,
  ) {
    return this.saleDetailsService.update(id, updateSaleDetailDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sale detail' })
  @ApiResponse({ status: 200, description: 'Sale detail deleted successfully' })
  @ApiResponse({ status: 404, description: 'Sale detail not found' })
  @Roles(Role.ADMINISTRATOR)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.saleDetailsService.remove(id);
  }
}

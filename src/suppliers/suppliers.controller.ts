import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '../../generated/prisma';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role.guard';
import { ToggleActiveService } from '../common/services/toggle-active.service';
import { CreateSupplierDto, SearchSupplierDto, UpdateSupplierDto } from './dto';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
    private readonly toggleActiveService: ToggleActiveService,
  ) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async createSupplier(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all suppliers with optional filtering' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully' })
  async getSuppliers(@Query() query: SearchSupplierDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Supplier found' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.suppliersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update supplier by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Deactivate supplier (logical deletion)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Supplier deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async deactivateSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('supplier', id, {
      isActive: false,
    });
  }

  @Patch(':id/activate')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Activate supplier' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Supplier activated successfully',
  })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async activateSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.toggleActiveService.toggleActive('supplier', id, {
      isActive: true,
    });
  }
}

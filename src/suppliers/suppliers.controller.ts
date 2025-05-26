import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
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
import { CreateSupplierDto, SearchSupplierDto, UpdateSupplierDto } from './dto';
import {
  SupplierListResponseDto,
  SupplierResponseDto,
} from './dto/supplier-response.dto';
import {
  ISupplierListResponse,
  ISupplierResponse,
} from './interfaces/supplier.interface';
import { SuppliersService } from './suppliers.service';

@ApiTags('Suppliers Management')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Create a new supplier',
    description:
      'Creates a new supplier in the system. Requires administrator privileges.',
  })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Supplier created successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid supplier data provided',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Requires administrator role',
  })
  createSupplier(
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<ISupplierResponse> {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all suppliers',
    description:
      'Retrieves a paginated list of suppliers with optional filtering.',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter suppliers by active status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description:
      'Search term to filter suppliers by name, contact, email, or document number',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Suppliers retrieved successfully',
    type: SupplierListResponseDto,
  })
  getSuppliers(
    @Query() query: SearchSupplierDto,
  ): Promise<ISupplierListResponse> {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get supplier by ID',
    description: 'Retrieves detailed information about a specific supplier.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the supplier',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier found successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  getSupplierById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ISupplierResponse> {
    return this.suppliersService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Update supplier',
    description:
      "Updates an existing supplier's information. Requires administrator privileges.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the supplier to update',
    example: 1,
  })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier updated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Requires administrator role',
  })
  updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<ISupplierResponse> {
    return this.suppliersService.update(id, updateSupplierDto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Deactivate supplier',
    description:
      'Performs a soft delete of a supplier. Requires administrator privileges.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the supplier to deactivate',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier deactivated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Requires administrator role',
  })
  deactivateSupplier(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ISupplierResponse> {
    return this.suppliersService.toggleActive(id, false);
  }

  @Patch(':id/activate')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({
    summary: 'Activate supplier',
    description:
      'Reactivates a previously deactivated supplier. Requires administrator privileges.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Unique identifier of the supplier to activate',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Supplier activated successfully',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Supplier not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - Requires administrator role',
  })
  activateSupplier(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ISupplierResponse> {
    return this.suppliersService.toggleActive(id, true);
  }
}

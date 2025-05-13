import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { Roles } from '../auth/decorators';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Role } from '../auth/interfaces';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto, FilterDiscountDto, UpdateDiscountDto } from './dto';

@ApiTags('Discounts')
@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Create a new discount' })
  @ApiResponse({ status: 201, description: 'Discount successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountsService.create(createDiscountDto);
  }

  @Get()
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get paginated list of discounts' })
  @ApiResponse({
    status: 200,
    description: 'Discount list successfully retrieved',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (starts at 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter by discount name',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by discount type (PERCENTAGE or FIXED_AMOUNT)',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'priceId',
    required: false,
    description: 'Filter by price ID',
  })
  @ApiQuery({
    name: 'isCurrentlyValid',
    required: false,
    description: 'Filter by current validity (active now)',
  })
  findAll(@Query() filterDiscountDto: FilterDiscountDto) {
    return this.discountsService.findAll(filterDiscountDto);
  }

  @Get(':id')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiResponse({ status: 200, description: 'Discount found' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'id', description: 'Discount ID', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.findOne(id);
  }

  @Get('price/:priceId/current')
  @Roles(Role.ADMINISTRATOR, Role.SALESPERSON)
  @ApiOperation({ summary: 'Get current discounts for a price' })
  @ApiResponse({ status: 200, description: 'Current discounts found' })
  @ApiResponse({ status: 404, description: 'Price not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Authentication required',
  })
  @ApiParam({ name: 'priceId', description: 'Price ID', example: 1 })
  getCurrentDiscounts(@Param('priceId', ParseIntPipe) priceId: number) {
    return this.discountsService.getCurrentDiscounts(priceId);
  }

  @Patch(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Update a discount' })
  @ApiResponse({ status: 200, description: 'Discount successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  @ApiParam({ name: 'id', description: 'Discount ID', example: 1 })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Delete(':id')
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiResponse({ status: 200, description: 'Discount successfully deleted' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Administrators only' })
  @ApiParam({ name: 'id', description: 'Discount ID', example: 1 })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.discountsService.remove(id);
  }
}

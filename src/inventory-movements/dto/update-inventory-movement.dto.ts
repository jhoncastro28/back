import { PartialType } from '@nestjs/swagger';
import { CreateInventoryMovementDto } from './create-inventory-movement.dto';

/**
 * Data Transfer Object for updating an existing inventory movement
 *
 * Extends CreateInventoryMovementDto making all fields optional.
 * Only fields that need to be updated should be included in the request.
 *
 * @example
 * {
 *   "quantity": 150,
 *   "notes": "Updated quantity after recount",
 *   "status": "APPROVED"
 * }
 */
export class UpdateInventoryMovementDto extends PartialType(
  CreateInventoryMovementDto,
) {}

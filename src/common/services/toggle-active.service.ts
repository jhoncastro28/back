import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToggleActiveDto } from '../dto/toggle-active.dto';

/**
 * Service responsible for handling entity activation/deactivation operations
 * Provides a generic way to toggle the active status of any entity in the system
 */
@Injectable()
export class ToggleActiveService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Toggles the active status of a specified entity
   * @param model - The Prisma model name (e.g., 'user', 'product', 'client')
   * @param id - The unique identifier of the entity
   * @param dto - DTO containing the new active status
   * @returns Object containing the updated entity and a success message
   * @throws NotFoundException when the entity is not found
   * @throws BadRequestException when the update operation fails
   */
  async toggleActive(model: string, id: number | string, dto: ToggleActiveDto) {
    try {
      const existingEntity = await this.prisma[model].findUnique({
        where: { id },
      });

      if (!existingEntity) {
        throw new NotFoundException(`${model} with ID ${id} not found`);
      }

      const updatedEntity = await this.prisma[model].update({
        where: { id },
        data: {
          isActive: dto.isActive,
        },
      });

      return {
        message: dto.isActive
          ? `${model} activated successfully`
          : `${model} deactivated successfully`,
        data: updatedEntity,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Error updating ${model} status: ${error.message}`,
      );
    }
  }
}

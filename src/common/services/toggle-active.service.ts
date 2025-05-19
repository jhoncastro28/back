import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ToggleActiveDto } from '../dto/toggle-active.dto';

@Injectable()
export class ToggleActiveService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Toggle the active status of an entity
   * @param model - The Prisma model name (e.g., 'user', 'product', 'client')
   * @param id - The entity ID
   * @param dto - The ToggleActiveDto containing the new active status
   * @returns The updated entity with a success message
   */
  async toggleActive(model: string, id: number | string, dto: ToggleActiveDto) {
    try {
      // Check if the entity exists
      const existingEntity = await this.prisma[model].findUnique({
        where: { id },
      });

      if (!existingEntity) {
        throw new NotFoundException(`${model} with ID ${id} not found`);
      }

      // Update the active status of the entity
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

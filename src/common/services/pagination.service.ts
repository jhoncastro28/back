import { Injectable } from '@nestjs/common';
import {
  PaginatedResponse,
  PaginationMeta,
} from '../interfaces/pagination.interface';

/**
 * Service responsible for handling pagination operations
 * Provides utilities for creating paginated responses and calculating pagination offsets
 */
@Injectable()
export class PaginationService {
  /**
   * Creates a standardized pagination response object
   * @param data - Array of items for the current page
   * @param total - Total number of items across all pages
   * @param page - Current page number (1-based)
   * @param limit - Number of items per page
   * @param message - Optional success message
   * @returns Paginated response containing data, metadata and status
   */
  createPaginationObject<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return {
      data,
      meta,
      message,
      success: true,
    };
  }

  /**
   * Calculates the number of items to skip for pagination
   * @param page - Current page number (1-based), defaults to 1
   * @param limit - Number of items per page, defaults to 10
   * @returns Number of items to skip
   */
  getPaginationSkip(page: number = 1, limit: number = 10): number {
    return (page - 1) * limit;
  }
}

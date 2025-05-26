import { Injectable } from '@nestjs/common';
import {
  BaseReportQueryParams,
  FullReportResponse,
  PaginatedReportResponse,
} from '../interfaces/report.interface';
import { PaginationService } from './pagination.service';

@Injectable()
export class ReportService {
  constructor(private readonly paginationService: PaginationService) {}

  /**
   * Processes report data and returns either paginated or full results
   * @param data Array of report items
   * @param total Total number of records
   * @param query Query parameters with pagination options
   * @param successMessage Success message for the response
   * @returns Either paginated or full report response
   */
  processReportData<T>(
    data: T[],
    total: number,
    query: BaseReportQueryParams,
    successMessage: string,
  ): PaginatedReportResponse<T> | FullReportResponse<T> {
    const { isPaginated = true, page = 1, limit = 10 } = query;

    if (!isPaginated) {
      return {
        data,
        totalRecords: total,
        message: successMessage,
        success: true,
      };
    }

    const { meta } = this.paginationService.createPaginationObject(
      data,
      total,
      page,
      limit,
      successMessage,
    );

    return {
      data,
      meta,
      message: successMessage,
      success: true,
    };
  }

  /**
   * Calculates pagination parameters for database queries
   * @param query Query parameters with pagination options
   * @returns Object with skip and take values for database query
   */
  getPaginationParams(query: BaseReportQueryParams): {
    skip?: number;
    take?: number;
  } {
    const { isPaginated = true, page = 1, limit = 10 } = query;

    if (!isPaginated) {
      return {};
    }

    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}

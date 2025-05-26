import { PaginationMeta } from './pagination.interface';

/**
 * Base parameters for report queries with optional pagination
 */
export interface BaseReportQueryParams {
  /**
   * Whether to return paginated results
   * @default true - for table view in frontend
   */
  isPaginated?: boolean;

  /**
   * Page number for pagination
   * @default 1
   */
  page?: number;

  /**
   * Number of items per page
   * @default 10
   */
  limit?: number;
}

/**
 * Base response structure for paginated reports
 */
export interface PaginatedReportResponse<T> {
  /**
   * Array of report items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;

  /**
   * Response message
   */
  message: string;

  /**
   * Operation success status
   */
  success: boolean;
}

/**
 * Base response structure for non-paginated reports (full data export)
 */
export interface FullReportResponse<T> {
  /**
   * Array of all report items
   */
  data: T[];

  /**
   * Total number of records
   */
  totalRecords: number;

  /**
   * Response message
   */
  message: string;

  /**
   * Operation success status
   */
  success: boolean;
}

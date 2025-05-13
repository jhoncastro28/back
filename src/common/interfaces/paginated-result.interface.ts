/**
 * Paginated Result Interface
 *
 * Generic interface for paginated results across the application
 * Provides a consistent structure for all paginated responses
 *
 * @template T - Type of data items in the paginated result
 */
export interface PaginatedResult<T> {
  /**
   * Array of data items
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: {
    /**
     * Total number of items across all pages
     */
    total: number;

    /**
     * Current page number
     */
    page: number;

    /**
     * Number of items per page
     */
    limit: number;

    /**
     * Total number of pages
     */
    totalPages: number;

    /**
     * Whether there is a next page
     */
    hasNextPage: boolean;

    /**
     * Whether there is a previous page
     */
    hasPreviousPage: boolean;
  };

  /**
   * Response message
   */
  message: string;
}

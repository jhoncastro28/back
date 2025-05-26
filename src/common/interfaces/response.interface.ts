export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BaseResponse {
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends BaseResponse {
  data: T[];
  meta: PaginationMeta;
}

export interface FullResponse<T> extends BaseResponse {
  data: T[];
  total: number;
}

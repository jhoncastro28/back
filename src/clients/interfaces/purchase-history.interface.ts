import {
  PaginatedResponse,
  PaginationMeta,
} from '../../common/interfaces/pagination.interface';

export interface PurchaseHistoryMeta extends PaginationMeta {
  clientId: number;
  clientName: string;
}

export interface PurchaseHistoryResponse<T>
  extends Omit<PaginatedResponse<T>, 'meta'> {
  meta: PurchaseHistoryMeta;
}

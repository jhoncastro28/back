import { PaginatedResponse } from '../../common/interfaces/pagination.interface';

export interface ISupplier {
  id: number;
  name: string;
  contactName: string | null;
  email: string | null;
  phoneNumber: string | null;
  address: string | null;
  documentType: 'CC' | 'TI' | null;
  documentNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  products?: Array<{
    id: number;
    name: string;
    currentStock: number;
  }>;
  inventoryMovements?: Array<{
    id: number;
    type: 'ENTRY' | 'EXIT';
    quantity: number;
    movementDate: Date;
  }>;
}

export interface ISupplierResponse {
  success: boolean;
  message?: string;
  data: any;
}

export type ISupplierListResponse = PaginatedResponse<any>;

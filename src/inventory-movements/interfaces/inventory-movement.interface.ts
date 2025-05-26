import { MovementType } from '../dto/inventory-movement.types';

export interface IProduct {
  id: number;
  name: string;
  description?: string;
  currentStock: number;
}

export interface ISupplier {
  id: number;
  name: string;
  contactName?: string;
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ISale {
  id: number;
  saleDate: Date;
  totalAmount: number;
}

export interface IInventoryMovement {
  id: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  movementDate: Date;
  productId: number;
  product: IProduct;
  supplierId?: number;
  supplier?: ISupplier;
  userId: string;
  user: IUser;
  saleId?: number;
  sale?: ISale;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaginatedInventoryMovements {
  data: IInventoryMovement[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

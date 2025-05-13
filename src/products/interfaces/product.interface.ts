export interface Product {
  id: number;
  name: string;
  description?: string;
  minQuantity: number;
  maxQuantity?: number;
  currentStock: number;
  isActive: boolean;
  supplierId: number;
  createdAt: Date;
  updatedAt: Date;
}

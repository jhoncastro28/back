export interface ISaleDetail {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ISale {
  id: number;
  saleDate: Date;
  clientId: number;
  clientName: string;
  userId: string;
  userName: string;
  totalAmount: number;
  items: ISaleDetail[];
}

export interface ISalesSummary {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalSales: number;
  averageSaleAmount: number;
  totalItemsSold: number;
  uniqueClients?: number;
  productsSold?: number;
}

export interface ITopPerformer {
  id: number;
  name: string;
  totalRevenue: number;
  totalCount: number;
  averageRevenue: number;
}

export interface ITopPerformers {
  products?: ITopPerformer[];
  clients?: ITopPerformer[];
  users?: ITopPerformer[];
}

export interface IProductSalesReport {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  numberOfSales: number;
}

export interface IClientSalesReport {
  clientId: number;
  clientName: string;
  totalPurchases: number;
  numberOfPurchases: number;
  averagePurchaseAmount: number;
  totalItemsPurchased: number;
}

export interface IDateSalesReport {
  date: string;
  totalRevenue: number;
  numberOfSales: number;
  totalItemsSold: number;
  averageSaleAmount: number;
}

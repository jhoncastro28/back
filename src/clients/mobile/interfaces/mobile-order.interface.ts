export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface MobileOrder {
  id: string;
  orderNumber: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  address: string;
  paymentMethod: string;
}

export interface MobileOrderDetail extends MobileOrder {
  store: string;
  discount: number;
}

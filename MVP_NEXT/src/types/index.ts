// Types do Firestore

export type ItemStatus = "AVAILABLE" | "RESERVED" | "SOLD";
export type OrderStatus = "PENDING" | "PAID" | "CANCELED";
export type ItemCondition = "novo" | "semi-novo" | "usado";

export interface Seller {
  id: string;
  name: string;
  whatsapp: string;
  createdAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  size?: string;
  brand?: string;
  condition?: ItemCondition;
  imageUrl: string;
  images?: string[]; // múltiplas fotos (futuro)
  status: ItemStatus;
  city: string;
  sellerId: string;
  seller?: Seller;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Order {
  id: string;
  itemId: string;
  item?: Item;
  buyerName: string;
  buyerWhats: string;
  status: OrderStatus;
  paymentRef?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  provider: "MP" | "MOCK"; // Mercado Pago ou Mock
  grossCents: number; // valor total
  feeMarketplaceCents: number; // comissão do marketplace (5%)
  feeProviderCents: number; // taxa do MP
  netCents: number; // líquido pro vendedor
  status: "PENDING" | "PAID" | "REFUNDED";
  payload?: any; // dados do gateway
  createdAt: Date;
  paidAt?: Date;
}

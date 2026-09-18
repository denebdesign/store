export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'cancelled';

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string; // e.g. '박스', '마리', '망', '개', 'kg'
  emoji?: string;
  description?: string;
  isAvailable?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  unit: string;
  emoji?: string;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: number; // e.g. 1027
  storeId: string;
  createdAt: string; // ISO string
  customerName: string;
  phone: string;
  address: string;
  detailAddress: string;
  deliveryRequest: string;
  items: OrderItem[];
  totalAmount: number;
  totalUnits: number;
  status: OrderStatus;
  notes?: string;
}

export interface Store {
  id: string;
  slug: string; // e.g. 'jeju-carrot'
  name: string; // e.g. '○○농장 (제주 구좌 당근)'
  shortName: string; // e.g. '○○농장'
  category: 'farm' | 'fish' | 'fruit' | 'market';
  intro: string; // e.g. '제주 구좌 당근입니다'
  notice?: string;
  emoji: string;
  isOrderActive: boolean;
  orderDeadline: string; // e.g. '오늘 오후 6:00'
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  ownerPhone: string;
  ownerKakaoId?: string;
  ownerKakaoNickname?: string;
  managerKakaoIds?: string[]; // List of Kakao User IDs authorized as boss/admin
  inviteCode?: string; // Secret boss code / invite code (e.g. 'FARM-7788' or 6 digits)
  adminPin?: string; // 4-digit PIN for quick boss login (default '1234')
  products: Product[];
}

export interface PreviousOrderProfile {
  customerName: string;
  phone: string;
  address: string;
  detailAddress: string;
  deliveryRequest: string;
  items: OrderItem[];
  storeId: string;
  orderedAt: string;
}

export interface UserProfile {
  id: string; // Kakao ID
  nickname: string;
  email?: string;
  profileImage?: string;
  createdAt: string;
  lastLoginAt: string;
  storeIds?: string[];
}



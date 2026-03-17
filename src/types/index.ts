export type TransactionType = 'income' | 'expense';

export interface User {
  uid: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  memberId: string;
  description: string;
  paymentMethod: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  month: number;
  year: number;
  limitAmount: number;
  createdAt: string;
}

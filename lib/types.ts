import { ObjectId } from "mongodb";

export interface User {
  _id?: ObjectId | string;
  email: string;
  name?: string;
  image?: string;
  settings?: {
    notifications?: any;
    general?: any;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Category {
  _id?: ObjectId | string;
  userId: string;
  name: string;
  type: "income" | "expense";
  color?: string;
  icon?: string;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Transaction {
  _id?: ObjectId | string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  categoryId?: ObjectId | string
  category?: string;
  description?: string;
  notes?: string;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Budget {
  _id?: ObjectId | string;
  userId: string;
  categoryId?: ObjectId | string;
  category?: string;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Goal {
  _id?: ObjectId | string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatConversation {
  _id?: ObjectId | string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

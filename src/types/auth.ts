export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  courier: Courier;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export type UserRole = 'COURIER' | 'ADMIN' | 'SELLER' | 'CUSTOMER';
export type CourierStatus = 'active' | 'inactive' | 'suspended' | 'blocked';

export interface Courier {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  role?: UserRole;
  availability?: 'available' | 'busy' | 'offline';
  isAvailable?: boolean;
  status?: CourierStatus;
  vehicle?: {
    type: 'bike' | 'scooter' | 'car';
    plate?: string;
  };
  stats?: {
    totalDeliveries: number;
    completedDeliveries: number;
    rating: number;
  };
  createdAt?: string;
  updatedAt?: string;
}
export type DeliveryProvider = 'DIAYAL' | 'YANGO' | 'MANUAL' | 'OTHER';

export type DeliveryStatus = 
  | 'DRAFT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PICKUP_PENDING'
  | 'PICKED_UP'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELED';

export type DeliveryFeePayer = 'CUSTOMER' | 'MERCHANT' | 'PLATFORM' | 'SPLIT';

export type FailureReason = 
  | 'CUSTOMER_ABSENT'
  | 'ADDRESS_NOT_FOUND'
  | 'PHONE_UNREACHABLE'
  | 'CUSTOMER_REFUSED'
  | 'DAMAGED_PACKAGE'
  | 'OTHER';

export interface Delivery {
  id: string;
  orderId: string;
  merchantId: string;
  customerId: string;
  provider: DeliveryProvider;
  status: DeliveryStatus;
  
  pickupContactName: string;
  pickupPhone: string;
  pickupAddressText: string;
  pickupLat?: number;
  pickupLng?: number;
  
  dropoffContactName: string;
  dropoffPhone: string;
  dropoffAddressText: string;
  dropoffLat?: number;
  dropoffLng?: number;
  
  distanceKm?: number;
  feeAmount: number;
  feeCurrency: string;
  feePayer: DeliveryFeePayer;
  
  cashOnDeliveryAmount?: number;
  notes?: string;
  
  validationCode?: string;
  validationType?: 'QR' | 'OTP' | 'NONE';
  
  failureReason?: FailureReason;
  failureComment?: string;
  
  requestedPickupAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  pickedUpAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  canceledAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStatusLog {
  id: string;
  deliveryId: string;
  oldStatus?: DeliveryStatus;
  newStatus: DeliveryStatus;
  changedByType: 'ADMIN' | 'COURIER' | 'SYSTEM' | 'PROVIDER';
  changedById?: string;
  locationLat?: number;
  locationLng?: number;
  meta: Record<string, any>;
  createdAt: string;
}
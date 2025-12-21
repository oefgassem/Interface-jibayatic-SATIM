// admin/types.ts

export enum PaymentStatus {
  REGISTERED = 'registered',
  RECEIVED = 'received', // Could be an intermediate status after SATIM callback, before ACK
  SUCCESS = 'success',
  FAILED = 'failed',
  ERROR = 'error', // General processing error
  REFUNDED = 'refunded',
  PENDING = 'pending', // Initial status before registration
}

export interface SatimPayload {
  pan: string;
  approvalCode: string;
  transactionDate: string; // Or Date type if parsed
  // Add other fields from SATIM ACK response as needed
}

export interface SapResponse {
  sapDocumentId?: string;
  message: string;
  fiscalYear?: string;
  // Add other SAP response fields
}

export interface Payment {
  orderId: string; // This is the unique ID from SATIM, used as primary key in DB
  orderNumber: string; // The original order number from your system
  amount: number;
  currency: string;
  status: PaymentStatus;
  retryCount: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  satimRegisterResponse?: any; // Raw response from SATIM register
  satimAckDetails?: SatimPayload; // Parsed or raw details from SATIM acknowledge
  sapResponse?: SapResponse;
  lastError?: string;
  actions: Array<{ timestamp: string; type: string; details: any }>;
}
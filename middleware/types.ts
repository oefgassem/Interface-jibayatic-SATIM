// admin/types.ts

export enum PaymentStatus {
  PENDING = 'pending',
  REGISTERED = 'registered',
  PAID = 'paid',
  SAP_PENDING = 'sap_pending',
  SAP_SYNCED = 'sap_synced',
  SAP_FAILED = 'sap_failed',
  ERROR = 'error',
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
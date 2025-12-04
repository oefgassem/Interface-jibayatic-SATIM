export enum PaymentStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  SENT_TO_SAP = 'SENT_TO_SAP',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED',
  RETRY_QUEUED = 'RETRY_QUEUED'
}

export interface SatimPayload {
  orderId: string;
  amount: number;
  currency: string;
  pan: string;
  approvalCode: string;
  transactionDate: string;
}

export interface SapResponse {
  sapDocumentId?: string;
  status?: string;
  message?: string;
  fiscalYear?: string;
  errorCode?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  paymentTime: string;
  status: PaymentStatus;
  retryCount: number;
  satimPayload: SatimPayload;
  sapResponse?: SapResponse;
  createdFromPortal?: boolean; // To distinguish manual simulation vs portal
  createdAt: string;
  updatedAt: string;
  lastError?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  source: 'API' | 'WORKER' | 'SAP_CONNECTOR' | 'CLIENT_PORTAL';
  message: string;
  details?: string;
}

export interface SatimConfig {
  merchantId: string; // userName
  terminalId: string;
  password: string;
  registerUrl: string;
  ackUrl: string; // Added ackUrl
}

export interface AppConfig {
  sapEndpoint: string;
  sapClient: string;
  retryInterval: number; // in seconds
  maxRetries: number;
  simulateSapFailure: boolean; // For testing
  sapFailureRate: number; // 0-100
  satim: SatimConfig;
}

export interface KpiData {
  totalVolume: number;
  successRate: number;
  pendingQueue: number;
  avgProcessingTime: number;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'UNPAID' | 'PAID';
}
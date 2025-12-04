import { AppConfig, PaymentStatus } from './types';

export const DEFAULT_CONFIG: AppConfig = {
  sapEndpoint: 'https://api.sap.s4hana.cloud/sap/opu/odata/sap/API_PAYMENT_SRV',
  sapClient: '100',
  retryInterval: 10,
  maxRetries: 3,
  simulateSapFailure: true,
  sapFailureRate: 30,
  satim: {
    merchantId: process.env.SATIM_USERNAME || 'SAT2511200956',
    password: process.env.SATIM_PASSWORD || 'satim120',
    terminalId: 'E010902273',
    registerUrl: process.env.SATIM_REGISTER_URL || 'https://test2.satim.dz/payment/rest/register.do',
    ackUrl: process.env.SATIM_ACK_URL || 'https://test2.satim.dz/payment/rest/public/acknowledgeTransaction.do'
  }
};

export const MOCK_USERS = [
  { id: 1, email: 'admin@jibayatec.dz', name: 'Admin User', role: 'ADMIN' },
  { id: 2, email: 'viewer@jibayatec.dz', name: 'Audit Viewer', role: 'VIEWER' },
];

export const STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.RECEIVED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [PaymentStatus.PROCESSING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [PaymentStatus.SENT_TO_SAP]: 'bg-purple-100 text-purple-800 border-purple-200',
  [PaymentStatus.COMPLETED]: 'bg-green-100 text-green-800 border-green-200',
  [PaymentStatus.ERROR]: 'bg-red-100 text-red-800 border-red-200',
  [PaymentStatus.RETRY_QUEUED]: 'bg-orange-100 text-orange-800 border-orange-200',
};
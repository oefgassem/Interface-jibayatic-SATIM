import { Payment, PaymentStatus, SystemLog, AppConfig, SatimPayload, Invoice } from '../types';
import { DEFAULT_CONFIG } from '../constants';

// In-memory storage to simulate Database & Redis
let paymentsStore: Payment[] = [];
let logsStore: SystemLog[] = [];
let configStore: AppConfig = { ...DEFAULT_CONFIG };

// Simulation State for Invoices
let currentInvoiceSequence = 1;
let currentInvoice: Invoice = {
  id: 'INV-2025-001',
  amount: 50000, // 50,000 DZD
  currency: 'DZD',
  description: 'Montant de la déclaration fiscale',
  status: 'UNPAID'
};

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

export const MockBackend = {
  // --- Configuration ---
  getConfig: () => configStore,
  updateConfig: (newConfig: Partial<AppConfig>) => {
    configStore = { ...configStore, ...newConfig };
    MockBackend.log('INFO', 'API', 'System configuration updated');
    return configStore;
  },

  // --- Logs ---
  getLogs: () => [...logsStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
  log: (level: SystemLog['level'], source: SystemLog['source'], message: string, details?: string) => {
    const newLog: SystemLog = {
      id: uuid(),
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      details
    };
    logsStore.unshift(newLog);
    if (logsStore.length > 200) logsStore.pop(); 
  },

  // --- Invoice Management (Client Portal) ---
  getCurrentInvoice: () => ({ ...currentInvoice }),
  
  rotateInvoice: () => {
    // Increment sequence for the NEXT invoice
    currentInvoiceSequence++;
    const seq = String(currentInvoiceSequence).padStart(3, '0');
    currentInvoice = {
      id: `INV-2025-${seq}`,
      amount: Math.floor(Math.random() * 100000) + 5000, // Random amount for variety
      currency: 'DZD',
      description: 'Montant de la déclaration fiscale',
      status: 'UNPAID'
    };
    return currentInvoice;
  },

  // --- Middleware API: Register Payment (mimics app.post('/api/satim/register')) ---
  // Input: Invoice ID (used as orderNumber) and Amount
  registerSatimOrder: async (invoiceId: string, amount: number, currencyCode: string = '012') => {
    const { satim } = configStore;
    
    // 1. Check if this OrderNumber (Invoice ID) is already paid/registered
    // In a real scenario, SATIM checks this. We simulate it here.
    const isDuplicate = paymentsStore.some(p => p.satimPayload.orderId === invoiceId || (p.satimPayload as any).udf1 === invoiceId);

    if (isDuplicate) {
        MockBackend.log('WARN', 'API', `Registration rejected: Duplicate Order ${invoiceId}`);
        return {
            errorCode: 1, // "La commande portant le numéro indiqué a déjà été traitée"
            errorMessage: "La commande portant le numéro indiqué a déjà été traitée ou l'identifiant enfant est incorrect."
        };
    }

    // 2. Generate Internal Order ID (SATIM's mdOrder)
    // In the real API, SATIM generates this. We simulate it.
    const satimMdOrder = `SAT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // 3. Construct Return URLs
    const returnUrl = `${window.location.origin}/#/portal?callback=return&orderId=${satimMdOrder}`;
    const failUrl = `${window.location.origin}/#/portal?callback=fail&orderId=${satimMdOrder}`;
    
    // 4. Construct the Real SATIM Payment Page URL
    // Note: In simulation, we point to the real test.satim.dz
    const formUrl = `https://test.satim.dz/payment/epg/merchants/merchantsatim/payment.html?mdOrder=${satimMdOrder}&language=fr`;

    MockBackend.log('INFO', 'API', `Registering Order ${invoiceId}`, `SATIM ID: ${satimMdOrder}`);

    // Store this mapping temporarily so we can verify it on return (Simulating Redis 'payment:{orderId}')
    // We store it with status 'registered'
    // Note: We don't add to paymentsStore yet, that happens on 'acknowledge' (Callback)
    // However, to check duplicates later, we might need to track it.
    // For this simulation, we'll assume duplicate check looks at COMPLETED payments.

    return {
        errorCode: 0,
        orderId: satimMdOrder,
        formUrl: formUrl
    };
  },

  // --- Middleware API: Handle Callback (mimics app.get('/satim/return')) ---
  // This is called when the user comes back from SATIM to the Portal
  finalizeSatimTransaction: async (satimMdOrder: string) => {
    MockBackend.log('INFO', 'API', `Handling SATIM Callback for Order ${satimMdOrder}`);
    
    // Check if already processed
    if (paymentsStore.find(p => p.orderId === satimMdOrder)) {
        return;
    }

    const payload: SatimPayload = {
      orderId: satimMdOrder,
      amount: currentInvoice.amount,
      currency: currentInvoice.currency,
      pan: '5022************9999',
      approvalCode: Math.random().toString(36).substring(7).toUpperCase(),
      transactionDate: new Date().toISOString()
    };

    // 1. Create Payment Record in DB (Status: RECEIVED)
    const newPayment: Payment = {
      id: uuid(),
      orderId: satimMdOrder,
      amount: payload.amount,
      currency: payload.currency,
      paymentTime: payload.transactionDate,
      status: PaymentStatus.RECEIVED, // Ready for Worker
      retryCount: 0,
      satimPayload: { ...payload, udf1: currentInvoice.id } as any, // Link Invoice ID
      createdFromPortal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    paymentsStore.push(newPayment);

    // 2. Mark current invoice as paid locally
    currentInvoice.status = 'PAID';

    MockBackend.log('INFO', 'API', `Payment ${satimMdOrder} queued for Worker`, 'Status: RECEIVED');
    return newPayment;
  },

  // New method: Receive Direct SATIM Notification (Webhook or Simulation)
  receiveSatimNotification: (payload: any, isWebhook: boolean = false) => {
    // Validate payload (basic check)
    if (!payload.orderId || !payload.amount) {
        MockBackend.log('ERROR', 'API', 'Invalid SATIM Notification payload');
        return;
    }

    const satimPayload: SatimPayload = {
        orderId: payload.orderId,
        amount: payload.amount,
        currency: payload.currency || 'DZD',
        pan: payload.pan || '5022************0000',
        approvalCode: payload.approvalCode || 'SIMULATED',
        transactionDate: payload.transactionDate || new Date().toISOString()
    };

    const newPayment: Payment = {
        id: uuid(),
        orderId: satimPayload.orderId,
        amount: satimPayload.amount,
        currency: satimPayload.currency,
        paymentTime: satimPayload.transactionDate,
        status: PaymentStatus.RECEIVED,
        retryCount: 0,
        satimPayload: satimPayload,
        createdFromPortal: isWebhook,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    paymentsStore.push(newPayment);
    MockBackend.log('INFO', 'API', `Received SATIM Notification for ${satimPayload.orderId}`, isWebhook ? 'Webhook' : 'Manual Simulation');
    return newPayment;
  },

  // --- Payments CRUD ---
  getPayments: () => [...paymentsStore].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  
  getPaymentById: (id: string) => paymentsStore.find(p => p.id === id),
  
  updatePaymentStatus: (id: string, status: PaymentStatus, sapResponse?: any, errorMsg?: string) => {
    const idx = paymentsStore.findIndex(p => p.id === id);
    if (idx !== -1) {
      const p = paymentsStore[idx];
      paymentsStore[idx] = {
        ...p,
        status,
        updatedAt: new Date().toISOString(),
        sapResponse: sapResponse || p.sapResponse,
        lastError: errorMsg,
        retryCount: (status === PaymentStatus.RETRY_QUEUED || status === PaymentStatus.ERROR) ? p.retryCount + 1 : p.retryCount
      };
    }
  },

  retryPaymentManually: (id: string) => {
    const p = paymentsStore.find(x => x.id === id);
    if (p) {
        MockBackend.updatePaymentStatus(id, PaymentStatus.RETRY_QUEUED);
        MockBackend.log('INFO', 'API', `Manual retry triggered for ${id}`);
    }
  },

  // --- Workflow Phase 2: Worker Process (Simulated) ---
  runWorkerCycle: async (): Promise<number> => {
    const pending = paymentsStore.filter(p => 
      p.status === PaymentStatus.RECEIVED || 
      p.status === PaymentStatus.RETRY_QUEUED
    );

    if (pending.length === 0) return 0;

    let processedCount = 0;

    for (const payment of pending) {
      processedCount++;
      
      // Update to processing
      MockBackend.updatePaymentStatus(payment.id, PaymentStatus.PROCESSING);
      MockBackend.log('INFO', 'WORKER', `Processing payment ${payment.orderId} for SAP`);

      // Simulate network delay to SAP
      await new Promise(r => setTimeout(r, 1500)); 

      // Simulate SAP Call
      const success = !configStore.simulateSapFailure || (Math.random() * 100 > configStore.sapFailureRate);

      if (success) {
        MockBackend.updatePaymentStatus(payment.id, PaymentStatus.COMPLETED, {
          sapDocumentId: `DOC-${Math.floor(Math.random() * 9000000)}`,
          status: 'POSTED',
          fiscalYear: new Date().getFullYear().toString(),
          message: 'Document posted successfully in S/4HANA'
        });
        MockBackend.log('SUCCESS', 'SAP_CONNECTOR', `Posted payment ${payment.orderId} to SAP`, `Doc ID: DOC-...`);
      } else {
        const canRetry = payment.retryCount < configStore.maxRetries;
        const newStatus = canRetry ? PaymentStatus.RETRY_QUEUED : PaymentStatus.ERROR;
        const errorMsg = 'Connection timed out or SAP backend unavailable';
        
        MockBackend.updatePaymentStatus(payment.id, newStatus, undefined, errorMsg);
        
        if (canRetry) {
           MockBackend.log('WARN', 'WORKER', `SAP Post failed for ${payment.orderId}. Retrying... (${payment.retryCount + 1}/${configStore.maxRetries})`, errorMsg);
        } else {
           MockBackend.log('ERROR', 'WORKER', `SAP Post failed for ${payment.orderId}. Max retries reached.`, errorMsg);
        }
      }
    }
    return processedCount;
  },

  generateDemoData: () => {
    const currencies = ['DZD', 'EUR', 'USD'];
    for(let i=0; i<3; i++) {
        const id = uuid();
        const txDate = new Date().toISOString();
        const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
        paymentsStore.push({
            id: id,
            orderId: orderId,
            amount: Math.floor(Math.random() * 50000) + 1000,
            currency: currencies[Math.floor(Math.random() * currencies.length)],
            paymentTime: txDate,
            status: PaymentStatus.RECEIVED,
            retryCount: 0,
            satimPayload: {
                orderId: orderId,
                amount: 5000,
                currency: 'DZD',
                pan: '5022************1234',
                approvalCode: '123456',
                transactionDate: txDate
            },
            createdAt: txDate,
            updatedAt: txDate,
            createdFromPortal: false
        });
    }
  }
};
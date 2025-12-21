import React, { useState, useEffect } from 'react';
import { Payment, PaymentStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Eye, RefreshCw, Search, Download } from 'lucide-react';
import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost/api';

export const PaymentsList = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Payment[]>(`${API_BASE_URL}/payments`);
      setPayments(response.data);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (orderId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/payments/${orderId}/retry`);
      fetchData(); // Refresh the list
      if (selectedPayment && selectedPayment.orderId === orderId) {
        // If the retried payment is currently selected, refetch its details
        const response = await axios.get<Payment>(`${API_BASE_URL}/payments/${orderId}`);
        setSelectedPayment(response.data);
      }
    } catch (err) {
      console.error(`Failed to retry payment ${orderId}:`, err);
      alert(`Failed to retry payment: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.orderNumber.toLowerCase().includes(filter.toLowerCase()) || // Search by original order number
    (p.satimAckDetails?.pan && p.satimAckDetails.pan.includes(filter)) || // Search by PAN if available
    p.orderId.includes(filter) // Search by SATIM transaction ID (orderId)
  );

  const exportCSV = () => {
    const headers = ["ID", "OrderID", "Amount", "Currency", "Status", "Time", "SAP_Msg"];
    const rows = payments.map(p => [
        p.orderId, p.orderNumber, p.amount, p.currency, p.status, p.createdAt, p.sapResponse?.message || ""
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search Order ID, PAN, Transaction ID..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button 
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
            <Download size={18} />
            <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retries</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <tr key={payment.orderId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{payment.orderNumber}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    ID: {payment.orderId}
                    {payment.satimAckDetails?.pan && <span className="ml-2">PAN: {payment.satimAckDetails.pan}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-bold">{payment.amount.toLocaleString()} <span className="text-xs font-normal text-gray-500">{payment.currency}</span></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={payment.status as PaymentStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payment.retryCount} {payment.lastError && <span className="text-red-500 text-xs ml-1">(Error)</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => setSelectedPayment(payment)}
                    className="text-blue-600 hover:text-blue-900 mx-2"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {loading && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Loading payments...
                    </td>
                </tr>
            )}
            {error && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
            )}
            {filteredPayments.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No transactions found
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-gray-800">Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="text-xl font-bold text-gray-900">{selectedPayment.orderNumber}</p>
                    </div>
                    <StatusBadge status={selectedPayment.status as PaymentStatus} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">SATIM Information</h4>
                        {selectedPayment.satimAckDetails ? (
                            <div className="space-y-1 text-sm text-blue-900">
                                <p><span className="font-semibold">PAN:</span> {selectedPayment.satimAckDetails.pan}</p>
                                <p><span className="font-semibold">Approval:</span> {selectedPayment.satimAckDetails.approvalCode}</p>
                                <p><span className="font-semibold">Time:</span> {selectedPayment.satimAckDetails.transactionDate}</p>
                                <p><span className="font-semibold">Amount:</span> {selectedPayment.amount} {selectedPayment.currency}</p>
                            </div>
                        ) : (<p className="text-sm text-gray-500 italic">No SATIM acknowledgement details yet.</p>)}
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">SAP S/4HANA Status</h4>
                        {selectedPayment.sapResponse ? (
                             <div className="space-y-1 text-sm text-gray-800">
                                <p><span className="font-semibold">Msg:</span> {selectedPayment.sapResponse.message}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No response from SAP yet.</p>
                        )}
                         {selectedPayment.lastError && (
                             <p className="text-xs text-red-600 mt-2 font-mono bg-red-50 p-1 rounded">Err: {selectedPayment.lastError}</p>
                        )}
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Raw Payload (JSON)</h4>
                    <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
{JSON.stringify(selectedPayment.satimRegisterResponse, null, 2)}
                    </pre>
                </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
                <button 
                    onClick={() => setSelectedPayment(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
                >
                    Close
                </button>
                {(selectedPayment.status === PaymentStatus.ERROR || selectedPayment.status === PaymentStatus.FAILED || selectedPayment.status === PaymentStatus.RECEIVED) && (
                     <button 
                        onClick={() => handleRetry(selectedPayment.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                     >
                        <RefreshCw size={16} />
                        <span>Force Retry</span>
                     </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
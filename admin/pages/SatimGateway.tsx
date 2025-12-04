import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { MockBackend } from '../services/mockBackend';

export const SatimGateway = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const orderId = searchParams.get('orderId') || 'UNKNOWN';
  const amount = searchParams.get('amount') || '0';
  const merchantId = searchParams.get('merchant') || 'JIBAYATEC';

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Simulate Processing Delay
      await new Promise(r => setTimeout(r, 2000));

      // 2. Generate Payment Success Payload (Simulates what SATIM sends to the webhook)
      const payload = {
        orderId: orderId,
        amount: parseFloat(amount),
        currency: 'DZD',
        pan: '502200******0009',
        approvalCode: Math.random().toString(36).substring(7).toUpperCase(),
        transactionDate: new Date().toISOString()
      };

      // 3. Simulate The Webhook Call (Server-to-Server)
      // In production, SATIM calls your backend URL. Here we call the mock backend.
      MockBackend.receiveSatimNotification(payload, true);

      // 4. Simulate Redirect to Return URL (Browser Redirect)
      navigate(`/portal?status=success&orderId=${orderId}`);

    } catch (err) {
      setLoading(false);
      setError('Transaction failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-12 p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden border border-gray-300">
        
        {/* SATIM Official Header Simulation */}
        <div className="bg-[#004A99] p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
             <div className="bg-white p-1 rounded">
               {/* Satim Logo Placeholder */}
               <CreditCard className="text-[#004A99]" size={24} />
             </div>
             <span className="text-white font-bold text-lg tracking-wide">SATIM</span>
          </div>
          <div className="flex items-center text-blue-100 text-xs space-x-1">
             <ShieldCheck size={14} />
             <span>Paiement Sécurisé</span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-blue-50 p-6 border-b border-blue-100">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Marchand</span>
                <span className="font-bold text-gray-800">{merchantId}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-sm">Commande Ref.</span>
                <span className="font-mono text-gray-800">{orderId}</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-blue-200">
                <span className="text-gray-800 font-bold uppercase">Montant à Payer</span>
                <span className="text-2xl font-bold text-[#004A99]">{parseInt(amount).toLocaleString()} DZD</span>
            </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handlePayment} className="p-6 space-y-5">
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm flex items-center">
                    <AlertCircle size={16} className="mr-2" />
                    {error}
                </div>
            )}
            
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Numéro de Carte</label>
                <div className="relative">
                    <input 
                        type="text" 
                        defaultValue="5022 0000 0000 0000" 
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A99] outline-none font-mono text-lg text-gray-700" 
                        placeholder="XXXX XXXX XXXX XXXX"
                    />
                    <CreditCard className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <div className="absolute right-3 top-3.5 flex space-x-1">
                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expiration</label>
                    <input 
                        type="text" 
                        defaultValue="12/28" 
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A99] outline-none font-mono text-center text-lg text-gray-700" 
                        placeholder="MM/YY"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CVV2</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            defaultValue="123" 
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A99] outline-none font-mono text-center text-lg text-gray-700" 
                            placeholder="***"
                        />
                        <Lock className="absolute right-3 top-3.5 text-gray-400" size={16} />
                    </div>
                </div>
            </div>
             <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nom du Porteur</label>
                <input 
                    type="text" 
                    defaultValue="M. TEST CLIENT" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004A99] outline-none uppercase text-gray-700" 
                />
            </div>

            <div className="pt-4">
                <button 
                    disabled={loading}
                    className="w-full bg-[#004A99] hover:bg-blue-800 text-white font-bold py-4 rounded-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center space-x-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Lock size={18} />}
                    <span>Valider le Paiement</span>
                </button>
                
                <button 
                    type="button"
                    onClick={() => navigate('/portal')}
                    className="w-full mt-4 text-gray-500 text-sm hover:text-gray-800 hover:underline py-2"
                >
                    Annuler la transaction
                </button>
            </div>
        </form>

        <div className="bg-gray-50 p-4 text-center text-[10px] text-gray-400 border-t border-gray-200">
             Société d'Automatisation des Transactions Interbancaires et de Monétique
             <br/>
             © SATIM 2025. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};
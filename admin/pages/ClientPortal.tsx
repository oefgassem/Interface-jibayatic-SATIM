import React, { useState, useEffect } from 'react';
import { MockBackend } from '../services/mockBackend';
import { CreditCard, Loader2, CheckCircle, Store, RefreshCcw, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Invoice } from '../types';

export const ClientPortal = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // URL Params for Callback handling
  const callbackType = searchParams.get('callback'); // 'return' or 'fail'
  const returnOrderId = searchParams.get('orderId');

  useEffect(() => {
    // Load current invoice state
    setInvoice(MockBackend.getCurrentInvoice());

    // If we just came back from SATIM successfully
    if (callbackType === 'return' && returnOrderId) {
       handleSuccessCallback(returnOrderId);
    }
  }, [callbackType, returnOrderId]);

  const handleSuccessCallback = async (orderId: string) => {
      // Simulate the backend endpoint '/satim/return' which queues the job
      await MockBackend.finalizeSatimTransaction(orderId);
  };

  const handleNextInvoice = () => {
      // Generate next invoice
      const next = MockBackend.rotateInvoice();
      setInvoice(next);
      setError(null);
      // Clear URL params
      navigate('/portal');
  };

  const initiatePayment = async () => {
    if (!invoice) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Call Middleware API to register
      // Mirrors: app.post('/api/satim/register')
      // Response expected: { errorCode: 0, orderId: "...", formUrl: "..." }
      const response = await MockBackend.registerSatimOrder(invoice.id, invoice.amount, invoice.currency);
      
      if (response.errorCode !== 0) {
          // Handle Error Code 1 (Already Paid) or others
          setLoading(false);
          if (response.errorCode === 1) {
              setError("Paiement déjà effectué pour cette commande (Error Code 1).");
          } else {
              setError(response.errorMessage || "Erreur lors de l'initialisation du paiement.");
          }
          return;
      }

      if (response.formUrl) {
        // 2. Redirect User to the EXTERNAL SATIM Gateway
        console.log("Redirecting to SATIM:", response.formUrl);
        
        // Note: Since the Order ID is generated in simulation but not registered on the real SATIM server,
        // The destination page will likely show "Invalid Order".
        // This confirms the redirection flow is correct for the demo.
        window.location.href = response.formUrl;
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
      setError('Impossible de contacter le middleware de paiement.');
    }
  };

  // --- RENDER STATES ---

  if (!invoice) return <div className="p-8">Loading Invoice System...</div>;

  // SUCCESS STATE (After Callback)
  if (callbackType === 'return') {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center space-y-6 max-w-md w-full">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle className="text-green-600" size={48} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Paiement Réussi</h1>
                    <p className="text-gray-500 mt-2 text-lg">Votre déclaration a été traitée avec succès.</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-left">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Référence Déclaration</span>
                        <span className="font-mono font-bold text-gray-800">{invoice.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-sm text-gray-500">ID Transaction</span>
                         <span className="font-mono font-bold text-blue-600">{returnOrderId}</span>
                    </div>
                </div>
                
                <div className="flex flex-col space-y-3">
                    <button onClick={handleNextInvoice} className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors flex items-center justify-center">
                        <span>Payer une autre déclaration</span>
                        <ArrowRight size={16} className="ml-2" />
                    </button>
                    <button onClick={() => navigate('/payments')} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                        Voir dans le Dashboard
                    </button>
                </div>
            </div>
       </div>
    );
  }

  // FAILURE STATE
  if (callbackType === 'fail') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="text-center space-y-6 max-w-md w-full">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-red-600" size={40} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Échec du Paiement</h1>
                    <p className="text-gray-500 mt-2">La transaction a été annulée ou refusée par la banque.</p>
                </div>
                <button onClick={() => navigate('/portal')} className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium">
                    Réessayer
                </button>
            </div>
        </div>
      );
  }

  // DEFAULT INVOICE STATE
  return (
    <div className="max-w-5xl mx-auto space-y-6">
       {/* Client Portal Header */}
       <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Store className="text-white" size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Portail Contribuable</h1>
                    <p className="text-gray-500">Direction Générale des Impôts (Simulation)</p>
                </div>
            </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Invoice Simulation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                {invoice.status === 'PAID' ? (
                     <div className="absolute top-0 right-0 p-4">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">Payé</span>
                     </div>
                ) : (
                     <div className="absolute top-0 right-0 p-4">
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">Non Payé</span>
                     </div>
                )}
                
                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Récapitulatif de paiement</h2>
                    
                    <div className="space-y-6 border-b border-gray-100 pb-6">
                        <div>
                             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contribuable</p>
                             <p className="font-semibold text-gray-900">SARL JIBAYATEC SERVICES</p>
                             <p className="text-sm text-gray-500">NIF: 000111222333444</p>
                        </div>
                        <div>
                             <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Réf. Avis de Paiement</p>
                             <p className="font-mono font-bold text-lg text-gray-900">{invoice.id}</p>
                        </div>
                    </div>

                    <div className="py-6">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-gray-600">{invoice.description}</span>
                             <span className="font-bold text-gray-900">{invoice.amount.toLocaleString()} DZD</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-400">
                             <span>Timbre fiscal</span>
                             <span>0 DZD</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 mb-6">
                        <span className="text-lg font-bold text-gray-900">Total à Payer</span>
                        <span className="text-3xl font-bold text-indigo-600">{invoice.amount.toLocaleString()} <span className="text-sm text-gray-500 font-normal">DZD</span></span>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-start border border-red-100">
                             <AlertTriangle className="mr-2 mt-0.5 shrink-0" size={16} />
                             {error}
                        </div>
                    )}

                    <button 
                        onClick={initiatePayment}
                        disabled={loading || invoice.status === 'PAID'}
                        className={`
                            w-full font-bold py-4 rounded-lg shadow-lg flex items-center justify-center space-x-2 transition-all
                            ${invoice.status === 'PAID' 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                : 'bg-[#004A99] text-white hover:bg-blue-800 active:scale-95 shadow-blue-200'
                            }
                        `}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                        <span>
                            {invoice.status === 'PAID' ? 'Déjà Payé' : 'Payer en ligne (CIB / Eddahabia)'}
                        </span>
                    </button>
                    
                    <div className="flex justify-center mt-4 space-x-2">
                         <div className="h-6 w-10 bg-gray-200 rounded"></div>
                         <div className="h-6 w-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

            {/* Explanation / Debug Info */}
            <div className="space-y-6">
                <div className="bg-slate-900 text-slate-300 rounded-xl p-6 font-mono text-xs">
                    <h3 className="text-white font-bold mb-4 flex items-center text-sm">
                        <RefreshCcw size={16} className="mr-2 text-green-400"/>
                        Backend Process Simulation
                    </h3>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="w-0.5 h-full bg-slate-700 my-1"></div>
                            </div>
                            <div>
                                <strong className="text-green-400">POST /api/satim/register</strong>
                                <p className="mt-1 opacity-70">App calls Middleware with amount & Invoice ID.</p>
                            </div>
                        </div>
                         <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="w-0.5 h-full bg-slate-700 my-1"></div>
                            </div>
                            <div>
                                <strong className="text-blue-400">Response (JSON)</strong>
                                <p className="mt-1 opacity-70 text-blue-200">
                                    {"{"} <br/>
                                    &nbsp;&nbsp;"errorCode": 0,<br/>
                                    &nbsp;&nbsp;"orderId": "SAT-123...",<br/>
                                    &nbsp;&nbsp;"formUrl": "https://test.satim.dz..."<br/>
                                    {"}"}
                                </p>
                            </div>
                        </div>
                         <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <div className="w-0.5 h-full bg-slate-700 my-1"></div>
                            </div>
                            <div>
                                <strong className="text-orange-400">Browser Redirect</strong>
                                <p className="mt-1 opacity-70">User redirected to real SATIM Gateway (external).</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <div className="w-0.5 h-full bg-slate-700 my-1"></div>
                            </div>
                            <div>
                                <strong className="text-yellow-400">GET /satim/return</strong>
                                <p className="mt-1 opacity-70">SATIM calls back with success status.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            </div>
                            <div>
                                <strong className="text-purple-400">Worker Queue</strong>
                                <p className="mt-1 opacity-70">Job added to BullMQ. Worker sends to SAP.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                    <strong className="flex items-center mb-1"><ExternalLink size={14} className="mr-1"/> Simulation Note:</strong> 
                    Clicking "Pay" will try to open the <strong>real SATIM Test URL</strong>. 
                    <br/><br/>
                    Since the Order ID is generated locally (not registered on SATIM servers due to CORS limits in this demo), 
                    the SATIM page will likely display <strong>"Invalid Order"</strong>.
                    <br/><br/>
                    This confirms the correct URL generation and redirect logic.
                </div>
            </div>
       </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { MockBackend } from '../services/mockBackend';
import { AppConfig } from '../types';
import { Save, AlertCircle, Globe, ShieldCheck, Database, RefreshCw } from 'lucide-react';

export const Settings = () => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setConfig(MockBackend.getConfig());
  }, []);

  const handleSave = () => {
    if (config) {
      MockBackend.updateConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!config) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* SATIM Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <span className="p-2 bg-green-100 rounded-lg mr-3">
               <CreditCardIcon className="text-green-600" size={20} />
            </span>
            SATIM Gateway Configuration
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID (Username)</label>
                <input 
                  type="text" 
                  value={config.satim.merchantId}
                  onChange={(e) => setConfig({...config, satim: {...config.satim, merchantId: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal ID</label>
                <input 
                  type="text" 
                  value={config.satim.terminalId}
                  onChange={(e) => setConfig({...config, satim: {...config.satim, terminalId: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  value={config.satim.password}
                  onChange={(e) => setConfig({...config, satim: {...config.satim, password: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                />
            </div>
        </div>

        <div className="mt-6 space-y-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Register URL (register.do)</label>
                <input 
                  type="text" 
                  value={config.satim.registerUrl}
                  onChange={(e) => setConfig({...config, satim: {...config.satim, registerUrl: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs text-gray-600"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acknowledge URL (acknowledgeTransaction.do)</label>
                <input 
                  type="text" 
                  value={config.satim.ackUrl}
                  onChange={(e) => setConfig({...config, satim: {...config.satim, ackUrl: e.target.value}})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs text-gray-600"
                />
            </div>
        </div>
      </div>

      {/* SAP Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <span className="p-2 bg-blue-100 rounded-lg mr-3">
              <Database className="text-blue-600" size={20} />
            </span>
            SAP S/4HANA Connection
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SAP OData Endpoint URL</label>
            <input 
              type="text" 
              value={config.sapEndpoint}
              onChange={(e) => setConfig({...config, sapEndpoint: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SAP Client ID</label>
                <input 
                  type="text" 
                  value={config.sapClient}
                  onChange={(e) => setConfig({...config, sapClient: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Auth Type</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option>Basic Auth (User/Pass)</option>
                    <option>OAuth 2.0</option>
                    <option>Client Certificate</option>
                </select>
             </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100">
             <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <span className="p-2 bg-orange-100 rounded-lg mr-3">
                  <RefreshCw className="text-orange-600" size={20} />
                </span>
                Retry & Resilience
            </h3>
            <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
                    <input 
                      type="number" 
                      value={config.maxRetries}
                      onChange={(e) => setConfig({...config, maxRetries: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of attempts before marking as ERROR.</p>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retry Interval (Seconds)</label>
                    <input 
                      type="number" 
                      value={config.retryInterval}
                      onChange={(e) => setConfig({...config, retryInterval: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                 </div>
            </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-100 bg-red-50 p-6 rounded-lg">
             <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center">
                <AlertCircle size={20} className="mr-2"/>
                Simulation Settings (Dev Only)
            </h3>
            <div className="flex items-center space-x-4">
                 <label className="flex items-center space-x-2 text-sm text-red-800">
                    <input 
                        type="checkbox" 
                        checked={config.simulateSapFailure}
                        onChange={(e) => setConfig({...config, simulateSapFailure: e.target.checked})}
                        className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span>Simulate Random SAP Failures</span>
                 </label>
                 {config.simulateSapFailure && (
                     <div className="flex items-center space-x-2">
                         <span className="text-sm text-red-800">Failure Rate:</span>
                         <input 
                            type="range" min="0" max="100" 
                            value={config.sapFailureRate}
                            onChange={(e) => setConfig({...config, sapFailureRate: parseInt(e.target.value)})}
                            className="w-32 accent-red-600"
                        />
                        <span className="text-sm font-bold text-red-800">{config.sapFailureRate}%</span>
                     </div>
                 )}
            </div>
        </div>

        <div className="mt-8 flex justify-end pb-8">
            <button 
                onClick={handleSave}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-medium transition-all ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                <Save size={20} />
                <span>{saved ? 'Saved Successfully' : 'Save Configuration'}</span>
            </button>
        </div>
      </div>
    </div>
  );
};

// Helper icon component since CreditCard is used in import
const CreditCardIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size || 24} 
        height={size || 24} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
);

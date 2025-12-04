import React, { useState, useEffect, useRef } from 'react';
import { MockBackend } from '../services/mockBackend';
import { SystemLog } from '../types';
import { Play, Plus, Trash2, Zap, Terminal } from 'lucide-react';

export const SimulationConsole = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isWorkerRunning, setIsWorkerRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = () => {
    setLogs(MockBackend.getLogs());
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Worker loop simulation
  useEffect(() => {
    let workerInterval: any;
    if (isWorkerRunning) {
        workerInterval = setInterval(async () => {
            await MockBackend.runWorkerCycle();
        }, 3000); // Check queue every 3 seconds
    }
    return () => clearInterval(workerInterval);
  }, [isWorkerRunning]);

  const generatePayment = () => {
    const currencies = ['DZD', 'EUR', 'USD'];
    MockBackend.receiveSatimNotification({
        orderId: `ORD-${Math.floor(Math.random() * 1000000)}`,
        amount: Math.floor(Math.random() * 50000) + 1000,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        pan: '5022************' + Math.floor(Math.random() * 8999 + 1000),
        approvalCode: Math.random().toString(36).substring(7).toUpperCase(),
        transactionDate: new Date().toISOString()
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col space-y-6">
        <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Simulation Controls</h3>
            <p className="text-sm text-gray-500 mb-6">Trigger events to test the middleware logic manually.</p>
            
            <button 
                onClick={generatePayment}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-xl hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all mb-4"
            >
                <Plus size={20} />
                <span className="font-semibold">Simulate Incoming Payment</span>
            </button>
            
             <button 
                onClick={() => MockBackend.generateDemoData()}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
            >
                <Zap size={16} />
                <span>Generate Batch (10)</span>
            </button>
        </div>

        <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Background Worker</h3>
            <div className={`p-4 rounded-xl border ${isWorkerRunning ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Worker Status</span>
                    <span className={`text-xs px-2 py-1 rounded uppercase font-bold ${isWorkerRunning ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {isWorkerRunning ? 'Running' : 'Stopped'}
                    </span>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                    The worker polls the queue for 'RECEIVED' or 'RETRY_QUEUED' payments and sends them to SAP.
                </p>
                <button 
                    onClick={() => setIsWorkerRunning(!isWorkerRunning)}
                    className={`w-full py-2 rounded-lg font-medium text-white transition-colors ${isWorkerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isWorkerRunning ? 'Stop Worker' : 'Start Worker'}
                </button>
            </div>
        </div>
      </div>

      {/* Live Logs */}
      <div className="lg:col-span-2 bg-slate-900 rounded-xl shadow-lg border border-slate-700 flex flex-col overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-700 bg-slate-950 flex justify-between items-center">
             <div className="flex items-center space-x-2">
                 <Terminal size={18} className="text-blue-400" />
                 <h3 className="text-sm font-mono font-bold text-gray-200">System Logs / Live Stream</h3>
             </div>
             <div className="flex items-center space-x-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                 <span className="text-xs text-gray-400">Live</span>
             </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
            {logs.length === 0 && (
                <div className="text-slate-600 text-center py-10">Waiting for system events...</div>
            )}
            {logs.map((log) => (
                <div key={log.id} className="flex space-x-3 hover:bg-slate-800 p-1 rounded">
                    <span className="text-slate-500 shrink-0">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`
                        font-bold shrink-0 w-16
                        ${log.level === 'INFO' ? 'text-blue-400' : ''}
                        ${log.level === 'WARN' ? 'text-yellow-400' : ''}
                        ${log.level === 'ERROR' ? 'text-red-400' : ''}
                        ${log.level === 'SUCCESS' ? 'text-green-400' : ''}
                    `}>[{log.level}]</span>
                    <span className="text-slate-400 shrink-0 w-24">[{log.source}]</span>
                    <div className="text-slate-300">
                        {log.message}
                        {log.details && <span className="block text-slate-500 mt-0.5">{log.details}</span>}
                    </div>
                </div>
            ))}
            <div ref={logsEndRef} />
         </div>
      </div>
    </div>
  );
};
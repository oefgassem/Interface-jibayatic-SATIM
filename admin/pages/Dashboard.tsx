import React, { useEffect, useState } from 'react';
import { MockBackend } from '../services/mockBackend';
import { PaymentStatus, Payment } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, RefreshCcw, AlertTriangle } from 'lucide-react';

const KpiCard = ({ title, value, change, trend, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      {trend === 'up' ? (
        <ArrowUpRight className="text-green-500 mr-1" size={16} />
      ) : (
        <ArrowDownRight className="text-red-500 mr-1" size={16} />
      )}
      <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
        {change}
      </span>
      <span className="text-gray-400 ml-2">vs last 24h</span>
    </div>
  </div>
);

export const Dashboard = () => {
  const [data, setData] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    error: 0,
    pending: 0,
    volume: 0
  });

  const refreshData = () => {
    const payments = MockBackend.getPayments();
    setData(payments);
    
    const total = payments.length;
    const success = payments.filter(p => p.status === PaymentStatus.COMPLETED).length;
    const error = payments.filter(p => p.status === PaymentStatus.ERROR).length;
    const pending = payments.filter(p => [PaymentStatus.RECEIVED, PaymentStatus.PROCESSING, PaymentStatus.RETRY_QUEUED].includes(p.status)).length;
    const volume = payments.reduce((acc, curr) => acc + curr.amount, 0);

    setStats({ total, success, error, pending, volume });
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Prepare chart data
  const statusData = [
    { name: 'Completed', value: stats.success, color: '#10B981' },
    { name: 'Error', value: stats.error, color: '#EF4444' },
    { name: 'Pending', value: stats.pending, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Volume (DZD)" 
          value={stats.volume.toLocaleString()} 
          change="+12.5%" 
          trend="up" 
          icon={ArrowUpRight} 
          color="bg-blue-500" 
        />
        <KpiCard 
          title="Success Rate" 
          value={`${stats.total ? Math.round((stats.success / stats.total) * 100) : 0}%`} 
          change="+2.1%" 
          trend="up" 
          icon={RefreshCcw} 
          color="bg-green-500" 
        />
        <KpiCard 
          title="Pending Queue" 
          value={stats.pending} 
          change="-5" 
          trend="down" 
          icon={AlertTriangle} 
          color="bg-yellow-500" 
        />
        <KpiCard 
          title="Failed / Retrying" 
          value={stats.error} 
          change="+1" 
          trend="down" 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Transaction Volume</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.slice(0, 20).reverse()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="createdAt" tickFormatter={(t) => new Date(t).toLocaleTimeString()} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h3>
          <div className="h-60">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {statusData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
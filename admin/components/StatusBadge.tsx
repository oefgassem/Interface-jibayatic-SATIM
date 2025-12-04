import React from 'react';
import { PaymentStatus } from '../types';
import { STATUS_COLORS } from '../constants';

export const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
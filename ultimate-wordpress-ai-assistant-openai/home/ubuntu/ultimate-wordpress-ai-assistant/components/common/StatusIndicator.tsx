
import React from 'react';
import { ConnectionStatus } from '../../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const colorClass = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500 animate-pulse',
    error: 'bg-red-500',
    disconnected: 'bg-gray-400',
  }[status];

  return <div className={`w-3 h-3 rounded-full ${colorClass} transition-colors`}></div>;
};

export default StatusIndicator;

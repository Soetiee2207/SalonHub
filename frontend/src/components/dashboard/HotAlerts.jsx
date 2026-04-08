import React from 'react';
import { FiAlertCircle, FiInfo, FiClock, FiPackage } from 'react-icons/fi';

const AlertItem = ({ type, title, message, time, icon: Icon }) => {
  const styles = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      text: 'text-red-800',
      iconColor: 'text-red-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      text: 'text-amber-800',
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      text: 'text-blue-800',
      iconColor: 'text-blue-500',
    }
  };

  const s = styles[type] || styles.info;

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border-l-4 transition-all hover:translate-x-1 ${s.bg} ${s.border} ${s.text} border-opacity-50 mb-3`}>
      <div className={`mt-0.5 ${s.iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-bold truncate">{title}</h5>
        <p className="text-xs opacity-90 mt-0.5">{message}</p>
        {time && (
          <div className="flex items-center gap-1 mt-2 text-[10px] uppercase font-bold opacity-60">
            <FiClock size={10} />
            {time}
          </div>
        )}
      </div>
    </div>
  );
};

const HotAlerts = ({ alerts = [], loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {alerts.length === 0 ? (
        <div className="text-center py-10">
          <FiInfo size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">Không có cảnh báo mới nào.</p>
        </div>
      ) : (
        alerts.map((alert, idx) => (
          <AlertItem key={idx} {...alert} />
        ))
      )}
    </div>
  );
};

export default HotAlerts;

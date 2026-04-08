import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = '#8B5E3C' }) => {
  const isPositive = trend === 'up';

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group">
      {/* Background Accent */}
      <div 
        className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundColor: color }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: `${color}15`, color: color }}
          >
            <Icon size={24} />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <h4 className="text-2xl font-bold text-gray-800 tracking-tight">{value}</h4>
        </div>

        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {isPositive ? <FiTrendingUp size={12} /> : <FiTrendingDown size={12} />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

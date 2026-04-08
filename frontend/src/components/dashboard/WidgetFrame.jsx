import React from 'react';

const WidgetFrame = ({ children, title, icon: Icon, extra, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300 ${className}`}>
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-2 rounded-lg bg-[rgba(139,94,60,0.1)] text-[#8B5E3C]">
                <Icon size={20} />
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-800 font-display">{title}</h3>
          </div>
          {extra && <div className="text-sm">{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default WidgetFrame;

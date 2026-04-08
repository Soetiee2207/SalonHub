import React from 'react';
import { FiUser, FiClock, FiCheck } from 'react-icons/fi';

const AppointmentRow = ({ appt }) => {
  const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
      <div className="w-12 text-center text-xs font-bold text-gray-500">
        {appt.startTime?.slice(0, 5)}
      </div>
      <div className="h-8 w-px bg-gray-200" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">
          {appt.customer?.fullName || 'Khách vãng lai'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {appt.service?.name || 'Dịch vụ'} • {appt.staff?.fullName || 'Bất kỳ thợ nào'}
        </p>
      </div>
      <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[appt.status] || 'bg-gray-100 text-gray-600'}`}>
        {appt.status}
      </div>
    </div>
  );
};

const LiveSchedule = ({ appointments = [], loading }) => {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-14 bg-gray-50 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {appointments.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-sm">Chưa có lịch hẹn nào cho hôm nay</p>
        </div>
      ) : (
        appointments.map((appt, idx) => (
          <AppointmentRow key={idx} appt={appt} />
        ))
      )}
    </div>
  );
};

export default LiveSchedule;

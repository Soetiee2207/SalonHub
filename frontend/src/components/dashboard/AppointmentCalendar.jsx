import React, { useMemo } from 'react';
import { FiChevronLeft, FiChevronRight, FiClock, FiUser } from 'react-icons/fi';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

const AppointmentCalendar = ({ appointments = [], currentDate, onDateChange, onAppointmentClick }) => {
  // Logic to calculate the week range based on currentDate
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    start.setDate(diff);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const formatDateKey = (date) => date.toISOString().split('T')[0];

  const getPosition = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const startHour = 8;
    const hourHeight = 80;
    return (h - startHour) * hourHeight + (m / 60) * hourHeight;
  };

  const getDurationHeight = (start, end) => {
    if (!end) return 60; // Default 1 hour
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    return (diff / 60) * 80;
  };

  const statusColors = {
    awaiting_deposit: 'bg-violet-100 border-violet-300 text-violet-800',
    pending: 'bg-amber-100 border-amber-300 text-amber-800',
    confirmed: 'bg-blue-100 border-blue-300 text-blue-800',
    in_progress: 'bg-purple-100 border-purple-300 text-purple-800',
    completed: 'bg-green-100 border-green-300 text-green-800',
    cancelled: 'bg-red-100 border-red-300 text-red-800',
  };

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[700px]">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FiClock className="text-[#8B5E3C]" />
          Lưới lịch làm việc (Tuần)
        </h3>
        <div className="flex items-center gap-4">
           <span className="text-sm font-bold text-gray-600">
             Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
           </span>
           <div className="flex bg-white rounded-lg border border-gray-200 p-1">
             <button onClick={handlePrevWeek} className="p-1 px-2 hover:bg-gray-100 rounded transition-colors border-0 cursor-pointer text-gray-500"><FiChevronLeft /></button>
             <button onClick={handleNextWeek} className="p-1 px-2 hover:bg-gray-100 rounded transition-colors border-0 cursor-pointer text-gray-500"><FiChevronRight /></button>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {/* Time Column & Grid */}
        <div className="flex min-w-[800px]">
          {/* Time Labels */}
          <div className="w-16 sticky left-0 z-20 bg-white border-r border-gray-100 pt-10">
            {HOURS.map(h => (
              <div key={h} className="h-20 text-[10px] font-bold text-gray-400 text-center pr-2">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Days Grid */}
          {weekDays.map((day, dIdx) => {
            const dateKey = formatDateKey(day);
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const dayAppts = appointments.filter(a => a.date === dateKey || a.appointmentDate === dateKey);

            return (
              <div key={dateKey} className={`flex-1 border-r border-gray-50 min-w-[120px] relative ${isToday ? 'bg-blue-50/10' : ''}`}>
                {/* Day Header */}
                <div className={`h-10 border-b border-gray-100 flex flex-col items-center justify-center sticky top-0 z-10 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                  <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-blue-600' : 'text-gray-400'}`}>
                    {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][day.getDay()]}
                  </span>
                  <span className={`text-xs font-black ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                    {day.getDate()}
                  </span>
                </div>

                {/* Grid Lines */}
                {HOURS.map(h => (
                  <div key={h} className="h-20 border-b border-gray-50 border-dashed" />
                ))}

                {/* Appointments */}
                {dayAppts.map(appt => {
                  const top = getPosition(appt.startTime);
                  const height = getDurationHeight(appt.startTime, appt.endTime);
                  
                  return (
                    <div
                      key={appt.id}
                      onClick={() => onAppointmentClick(appt)}
                      className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:z-30 overflow-hidden ${statusColors[appt.status] || 'bg-gray-100'}`}
                      style={{ top: `${top + 40}px`, height: `${height}px` }}
                    >
                      <p className="text-[10px] font-black truncate">{appt.customer?.fullName || 'Khách'}</p>
                      <p className="text-[9px] opacity-80 truncate uppercase font-bold">{appt.service?.name}</p>
                      {height > 40 && (
                        <div className="flex items-center gap-1 mt-1 opacity-70">
                          <FiUser size={8} />
                          <span className="text-[8px] truncate">{appt.staff?.fullName || 'Any'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;

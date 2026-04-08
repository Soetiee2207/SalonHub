import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiClock, FiMapPin, FiUser, FiChevronRight } from 'react-icons/fi';

function CountdownTimer({ targetDate, targetTime }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(`${targetDate}T${targetTime}`);

    const tick = () => {
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  const pad = (n) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1">
      {timeLeft.days > 0 && (
        <span
          className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md text-xs font-bold"
          style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
        >
          {timeLeft.days}d
        </span>
      )}
      <span
        className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md text-xs font-bold"
        style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
      >
        {pad(timeLeft.hours)}
      </span>
      <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>:</span>
      <span
        className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md text-xs font-bold"
        style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
      >
        {pad(timeLeft.minutes)}
      </span>
      <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>:</span>
      <span
        className="inline-flex items-center justify-center min-w-[28px] h-7 rounded-md text-xs font-bold animate-pulse"
        style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
      >
        {pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: '#F59E0B', bg: '#FFFBEB' },
  confirmed: { label: 'Đã xác nhận', color: '#3B82F6', bg: '#EFF6FF' },
};

export default function UpcomingAppointments({ appointments = [] }) {
  // Filter only upcoming pending/confirmed
  const now = new Date();
  const upcoming = appointments
    .filter((a) => {
      const apptDate = new Date(`${a.date}T${a.startTime || '00:00'}`);
      return apptDate > now && ['pending', 'confirmed'].includes(a.status);
    })
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`) - new Date(`${b.date}T${b.startTime}`))
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-6">
        <FiClock size={28} style={{ color: 'var(--text-gray)' }} className="mx-auto mb-2" />
        <p className="text-sm" style={{ color: 'var(--text-gray)' }}>
          Không có lịch hẹn sắp tới
        </p>
        <Link
          to="/book-appointment"
          className="inline-flex items-center gap-1 mt-2 text-sm font-medium"
          style={{ color: 'var(--primary)' }}
        >
          Đặt lịch ngay <FiChevronRight size={14} />
        </Link>
      </div>
    );
  }

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[date.getDay()]}, ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  };

  return (
    <div className="space-y-3">
      {upcoming.map((appt) => {
        const status = statusMap[appt.status] || statusMap.pending;
        const serviceName = appt.service?.name || appt.Service?.name || 'Dịch vụ';
        const staffName = appt.staff?.fullName || appt.Staff?.fullName || '';
        const branchName = appt.branch?.name || appt.Branch?.name || '';

        return (
          <div
            key={appt.id}
            className="rounded-xl p-4 border transition-shadow hover:shadow-md"
            style={{ borderColor: 'var(--border)', backgroundColor: '#fff' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4
                  className="font-semibold text-sm mb-0.5"
                  style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-display)' }}
                >
                  {serviceName}
                </h4>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-gray)' }}>
                  <span className="flex items-center gap-1">
                    <FiClock size={12} />
                    {formatDate(appt.date)} • {appt.startTime?.slice(0, 5)}
                  </span>
                </div>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs mb-3" style={{ color: 'var(--text-gray)' }}>
              {staffName && (
                <span className="flex items-center gap-1">
                  <FiUser size={12} />
                  {staffName}
                </span>
              )}
              {branchName && (
                <span className="flex items-center gap-1">
                  <FiMapPin size={12} />
                  {branchName}
                </span>
              )}
            </div>

            {/* Countdown */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--text-gray)' }}>
                Còn lại:
              </span>
              <CountdownTimer targetDate={appt.date} targetTime={appt.startTime || '00:00'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { FiClock } from 'react-icons/fi';

/**
 * CountdownTimer — Đồng hồ đếm ngược thanh toán
 * 
 * @param {string} createdAt - ISO timestamp khi tạo (appointment/order)
 * @param {number} timeoutMinutes - Số phút timeout (mặc định 2)
 * @param {function} onExpired - Callback khi hết giờ
 */
export default function CountdownTimer({ createdAt, timeoutMinutes = 2, onExpired }) {
  const [remaining, setRemaining] = useState(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (!createdAt) return;

    const createdTime = new Date(createdAt).getTime();
    const expiresAt = createdTime + timeoutMinutes * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, expiresAt - now);
      setRemaining(diff);

      if (diff <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpired?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAt, timeoutMinutes, onExpired]);

  if (remaining === null) return null;

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const isExpired = totalSeconds <= 0;
  const isUrgent = totalSeconds > 0 && totalSeconds <= 30;

  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-600 border border-red-200">
        <FiClock size={12} />
        Hết hạn thanh toán
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
        isUrgent
          ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      <FiClock size={12} className={isUrgent ? 'animate-spin' : ''} />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  FiBell, FiCheckCircle, FiTrash2, FiCalendar,
  FiShoppingBag, FiAlertCircle, FiInfo, FiGift
} from 'react-icons/fi';
import { notificationService } from '../../services/notificationService';

/* ---------- Helpers ---------- */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

const typeIconMap = {
  appointment: FiCalendar,
  order: FiShoppingBag,
  alert: FiAlertCircle,
  info: FiInfo,
  promotion: FiGift,
};

const typeColorMap = {
  appointment: 'bg-blue-50 text-blue-600',
  order: 'bg-green-50 text-green-600',
  alert: 'bg-red-50 text-red-600',
  info: 'bg-gray-100 text-gray-600',
  promotion: 'bg-purple-50 text-purple-600',
};

function getIcon(type) {
  return typeIconMap[type] || FiBell;
}

function getColor(type) {
  return typeColorMap[type] || 'bg-[var(--primary)]/10 text-[var(--primary)]';
}

/* ---------- Skeleton ---------- */
function SkeletonNotification() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-3 w-72 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    notificationService.getAll()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id) ? { ...n, isRead: true, read: true } : n)
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    } catch {
      // silent
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // silent
    }
  };

  const isUnread = (n) => !(n.isRead || n.read);
  const unreadCount = notifications.filter(isUnread).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thông báo</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">{unreadCount} thông báo chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--primary)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
          >
            <FiCheckCircle size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
        {loading ? (
          <>
            <SkeletonNotification />
            <SkeletonNotification />
            <SkeletonNotification />
            <SkeletonNotification />
          </>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FiBell size={40} className="mb-3 opacity-40" />
            <p className="text-sm">Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map(notification => {
            const id = notification.id;
            const unread = isUnread(notification);
            const Icon = getIcon(notification.type);
            const colorClass = getColor(notification.type);

            return (
              <div
                key={id}
                onClick={() => unread && handleMarkAsRead(id)}
                className={`flex items-start gap-4 p-4 cursor-pointer transition-colors ${
                  unread
                    ? 'bg-[var(--primary)]/[0.03] hover:bg-[var(--primary)]/[0.06]'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${unread ? 'font-semibold text-gray-800' : 'font-medium text-gray-600'}`}>
                      {notification.title}
                    </p>
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                    {notification.message || notification.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {timeAgo(notification.createdAt || notification.date)}
                  </p>
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(id);
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                  title="Xóa thông báo"
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

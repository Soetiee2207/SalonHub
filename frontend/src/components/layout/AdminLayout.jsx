import { useState, useMemo, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiMapPin, FiScissors, FiBox, FiUsers,
  FiShoppingBag, FiCalendar, FiTag, FiCreditCard,
  FiMenu, FiX, FiLogOut, FiArrowLeft, FiPackage, FiDollarSign, FiStar,
  FiTruck, FiClipboard, FiRefreshCw, FiFileText, FiBell,
  FiCheckCircle, FiTrash2, FiInfo, FiAlertCircle, FiGift
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { notificationService } from '../../services/notificationService';
import { useNotification } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';

const linksByRole = {
  admin: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/admin/branches', icon: FiMapPin, label: 'Chi nhánh' },
    { to: '/admin/services', icon: FiScissors, label: 'Dịch vụ' },
    { to: '/admin/products', icon: FiBox, label: 'Sản phẩm' },
    { to: '/admin/staff', icon: FiUsers, label: 'Nhân sự' },
    { to: '/admin/customers', icon: FiUsers, label: 'Khách hàng (CRM)' },
    { to: '/admin/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
    { to: '/admin/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
    { to: '/admin/vouchers', icon: FiTag, label: 'Khuyến mãi' },
    { to: '/admin/payments', icon: FiCreditCard, label: 'Thanh toán' },
    { to: '/admin/reviews', icon: FiStar, label: 'Đánh giá' },
  ],
  staff: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/admin/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
  ],
  service_staff: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/admin/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
  ],
  warehouse_staff: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard Thủ Kho', exact: true },
    { to: '/admin/fulfillment', icon: FiTruck, label: 'Vận chuyển đơn hàng' },
    { to: '/admin/inventory', icon: FiBox, label: 'Kho & Vật phẩm' },
    { to: '/admin/inventory-docs', icon: FiClipboard, label: 'Phiếu Nhập/Xuất' },
    { to: '/admin/returns', icon: FiRefreshCw, label: 'Đơn trả hàng' },
  ],
  accountant: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/admin/reconciliation', icon: FiCreditCard, label: 'Đối soát SePay/COD' },
    { to: '/admin/cash-ledger', icon: FiDollarSign, label: 'Sổ quỹ Thu/Chi' },
    { to: '/admin/refunds', icon: FiRefreshCw, label: 'Xử lý Hoàn tiền' },
    { to: '/admin/reports', icon: FiFileText, label: 'Báo cáo Tài chính' },
  ],
};

const roleLabels = {
  admin: 'Quản trị viên',
  staff: 'Nhân viên',
  service_staff: 'Nhân viên dịch vụ',
  warehouse_staff: 'Nhân viên kho',
  accountant: 'Kế toán',
};

/* ---------- Dropdown Helpers ---------- */
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { unreadCount, refreshUnreadCount, markAllReadOptimistic } = useNotification();
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

  const role = user?.role || 'staff';

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await notificationService.getAll({ limit: 10 });
      const data = res.data?.data || res.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải thông báo trong dropdown:', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (notifDropdownOpen) {
      fetchNotifications();
    }
  }, [notifDropdownOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id) ? { ...n, isRead: true, read: true } : n)
      );
      refreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      markAllReadOptimistic();
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
    } catch (err) {
      refreshUnreadCount();
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      refreshUnreadCount();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const sidebarLinks = useMemo(() => linksByRole[role] || linksByRole.staff, [role]);
  const roleLabel = roleLabels[role] || 'Nhân viên';

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-[var(--bg-light)]">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-white border-r border-[var(--border)] flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--border)]">
          <Link to="/admin" className="text-lg font-bold text-[var(--primary)] no-underline">
            SalonHub
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[var(--text-gray)] bg-transparent border-0 cursor-pointer">
            <FiX size={20} />
          </button>
        </div>

        {/* Role Badge */}
        <div className="px-5 py-3 border-b border-[var(--border)]">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(139,94,60,0.1)', color: 'var(--primary)' }}
          >
            {roleLabel}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <div className="flex flex-col gap-0.5">
            {sidebarLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                    active
                      ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                      : 'text-[var(--text-gray)] hover:text-[var(--text-dark)] hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[var(--border)] p-3">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-gray)] hover:bg-gray-50 no-underline transition-colors"
          >
            <FiArrowLeft size={18} />
            Về trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-[var(--text-gray)] bg-transparent border-0 cursor-pointer"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Notification Bell Dropdown */}
            <div className="relative mr-2" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center focus:outline-none"
              >
                <FiBell size={20} />
                {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center bg-red-500 text-white text-[8px] h-4 w-4 rounded-full font-black border border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>

              <AnimatePresence>
                {notifDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                    style={{
                      maxHeight: '480px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-50">
                      <span className="text-sm font-black text-slate-800 tracking-tight">Thông báo mới nhận</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[10px] font-black text-[var(--primary)] bg-transparent border-0 cursor-pointer hover:underline uppercase tracking-wide flex items-center gap-1"
                        >
                          Đọc tất cả
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto divide-y divide-slate-50 max-h-[360px] custom-scrollbar">
                      {notifLoading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <FiRefreshCw className="animate-spin text-slate-300 mb-2" size={24} />
                          <p className="text-xs font-semibold">Đang tải...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <FiBell className="text-slate-300 mb-2 opacity-60" size={32} />
                          <p className="text-xs font-semibold">Không có thông báo mới</p>
                        </div>
                      ) : (
                        notifications.map((n) => {
                          const unread = !(n.isRead || n.read);
                          const Icon = getIcon(n.type);
                          const colorClass = getColor(n.type);

                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (unread) handleMarkAsRead(n.id);
                              }}
                              className={`flex items-start gap-3 p-3.5 cursor-pointer transition-colors relative group text-left ${
                                unread
                                  ? 'bg-[var(--primary)]/[0.02] hover:bg-[var(--primary)]/[0.05]'
                                  : 'hover:bg-slate-50/50'
                              }`}
                            >
                              {/* Left Border for Unread */}
                              {unread && (
                                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--primary)] rounded-r" />
                              )}

                              {/* Icon */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                                <Icon size={14} />
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-1">
                                  <p className={`text-xs ${unread ? 'font-black text-slate-800' : 'font-bold text-slate-500'}`}>
                                    {n.title}
                                  </p>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words line-clamp-2">
                                  {n.message || n.content}
                                </p>
                                <p className="text-[9px] text-slate-300 font-extrabold uppercase mt-1">
                                  {timeAgo(n.createdAt || n.date)}
                                </p>
                              </div>

                              {/* Action buttons (Delete) */}
                              <button
                                onClick={(e) => handleDelete(n.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0 bg-transparent border-0 cursor-pointer"
                                title="Xóa thông báo"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    {(user?.role === 'customer' || user?.role === 'admin') && (
                      <div className="border-t border-slate-50 pt-2 px-4 pb-1 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="text-[11px] font-black text-slate-500 hover:text-[var(--primary)] uppercase tracking-wider no-underline block py-1.5 hover:bg-slate-50 rounded-xl transition-all"
                        >
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--text-dark)]">
                {user?.fullName || user?.name || roleLabel}
              </p>
              <p className="text-xs text-[var(--text-gray)]">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors bg-transparent border-0 cursor-pointer"
            >
              <FiLogOut size={16} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

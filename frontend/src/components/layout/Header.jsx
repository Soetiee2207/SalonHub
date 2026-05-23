import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiUser, FiShoppingCart, FiBell, FiMenu, FiX, FiLogOut, FiSettings, 
  FiCalendar, FiPackage, FiMapPin, FiCheckCircle, FiTrash2, FiInfo, 
  FiAlertCircle, FiGift, FiRefreshCcw, FiRefreshCw 
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useCart } from '../../contexts/CartContext';
import { useNotification } from '../../contexts/NotificationContext';
import { notificationService } from '../../services/notificationService';
import { motion, AnimatePresence } from 'framer-motion';

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
  order: FiPackage,
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

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { cartCount } = useCart();
  const { unreadCount, refreshUnreadCount, markAllReadOptimistic } = useNotification();
  const [isCartPopping, setIsCartPopping] = useState(false);
  const prevCartCount = useRef(cartCount);
  const dropdownRef = useRef(null);
  const socket = useSocket();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef(null);

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
    if (cartCount > prevCartCount.current) {
      setIsCartPopping(true);
      const timer = setTimeout(() => setIsCartPopping(false), 400);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Trang Chủ' },
    { to: '/services', label: 'Dịch Vụ' },
    { to: '/products', label: 'Sản Phẩm' },
    { to: '/book-appointment', label: 'Đặt Lịch' },
    { to: '/contact', label: 'Liên Hệ' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-[var(--primary)] no-underline">
            SalonHub
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                  isActive(link.to)
                    ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                    : 'text-[var(--text-gray)] hover:text-[var(--text-dark)] hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative p-2 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors">
                  <FiShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 bg-[var(--error)] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full ${isCartPopping ? 'animate-cart-pop shadow-lg' : ''} transition-all duration-300`}>
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative mr-1 flex items-center" ref={notifRef}>
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
                          top: '100%',
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
                        <div className="border-t border-slate-50 pt-2 px-4 pb-1 text-center">
                          <Link
                            to="/notifications"
                            onClick={() => setNotifDropdownOpen(false)}
                            className="text-[11px] font-black text-slate-500 hover:text-[var(--primary)] uppercase tracking-wider no-underline block py-1.5 hover:bg-slate-50 rounded-xl transition-all"
                          >
                            Xem tất cả thông báo
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <FiUser size={18} />
                    )}
                    <span className="text-sm font-medium text-[var(--text-dark)] hidden sm:block">{user.fullName || user.name}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border border-[var(--border)] rounded-xl py-1 z-50 shadow-2xl">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiSettings size={16} />
                        Thông Tin Cá Nhân
                      </Link>
                      <Link
                        to="/my-orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiPackage size={16} />
                        Quản Lý Đơn Hàng
                      </Link>
                      <Link
                        to="/my-appointments"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiCalendar size={16} />
                        Lịch Hẹn Của Tôi
                      </Link>
                      <Link
                        to="/my-addresses"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiMapPin size={16} />
                        Sổ Địa Chỉ
                      </Link>
                      {user.role !== 'customer' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--primary)] hover:bg-gray-50 no-underline"
                        >
                          <FiSettings size={16} />
                          Quản trị
                        </Link>
                      )}
                      <div className="border-t border-[var(--border)] my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--error)] hover:bg-gray-50 w-full"
                      >
                        <FiLogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-lg no-underline transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-lg no-underline transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[var(--text-gray)]"
          >
            {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-3">
            <nav className="flex flex-col gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium no-underline ${
                    isActive(link.to)
                      ? 'text-[var(--primary)] bg-[var(--primary)]/5'
                      : 'text-[var(--text-gray)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-[var(--border)] mt-3 pt-3">
              {/* User menus are now accessible via Avatar dropdown on mobile as well */}
              {!user && (
                <div className="flex flex-col gap-2 px-4">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center py-2.5 text-sm font-medium text-[var(--primary)] border border-[var(--primary)] rounded-lg no-underline">
                    Đăng nhập
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="text-center py-2.5 text-sm font-medium text-white bg-[var(--primary)] rounded-lg no-underline">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

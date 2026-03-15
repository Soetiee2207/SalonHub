import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiShoppingCart, FiBell, FiMenu, FiX, FiLogOut, FiSettings, FiCalendar, FiPackage, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { cartService } from '../../services/cartService';
import { notificationService } from '../../services/notificationService';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      cartService.getCart()
        .then(res => {
          const items = res.data?.items || res.items || [];
          setCartCount(items.length);
        })
        .catch(() => {});

      notificationService.getAll({ unread: true })
        .then(res => {
          const count = res.data?.totalUnread || res.totalUnread || 0;
          setUnreadCount(count);
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
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
    { to: '/', label: 'Trang chủ' },
    { to: '/services', label: 'Dịch vụ' },
    { to: '/products', label: 'Sản phẩm' },
    { to: '/book-appointment', label: 'Đặt lịch' },
    { to: '/contact', label: 'Liên hệ' },
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
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative p-2 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors">
                  <FiShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--error)] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors">
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[var(--error)] text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FiUser size={18} />
                    <span className="text-sm font-medium text-[var(--text-dark)]">{user.fullName || user.name}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-white border border-[var(--border)] rounded-xl py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiSettings size={16} />
                        Hồ sơ
                      </Link>
                      <Link
                        to="/my-orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiPackage size={16} />
                        Đơn hàng
                      </Link>
                      <Link
                        to="/my-appointments"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiCalendar size={16} />
                        Lịch hẹn
                      </Link>
                      <Link
                        to="/my-addresses"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] hover:bg-gray-50 no-underline"
                      >
                        <FiMapPin size={16} />
                        Địa chỉ
                      </Link>
                      {(user.role === 'admin' || user.role === 'staff') && (
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
              <div className="flex items-center gap-2">
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
              {user ? (
                <div className="flex flex-col gap-1">
                  <Link to="/cart" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiShoppingCart size={16} /> Giỏ hàng {cartCount > 0 && `(${cartCount})`}
                  </Link>
                  <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiBell size={16} /> Thông báo {unreadCount > 0 && `(${unreadCount})`}
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiUser size={16} /> Hồ sơ
                  </Link>
                  <Link to="/my-orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiPackage size={16} /> Đơn hàng
                  </Link>
                  <Link to="/my-appointments" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiCalendar size={16} /> Lịch hẹn
                  </Link>
                  <Link to="/my-addresses" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-dark)] no-underline">
                    <FiMapPin size={16} /> Địa chỉ
                  </Link>
                  {(user.role === 'admin' || user.role === 'staff') && (
                    <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--primary)] no-underline">
                      <FiSettings size={16} /> Quản trị
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--error)] w-full">
                    <FiLogOut size={16} /> Đăng xuất
                  </button>
                </div>
              ) : (
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

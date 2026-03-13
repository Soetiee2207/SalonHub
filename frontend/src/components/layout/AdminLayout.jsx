import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiMapPin, FiScissors, FiBox, FiUsers,
  FiShoppingBag, FiCalendar, FiTag, FiCreditCard,
  FiMenu, FiX, FiLogOut, FiArrowLeft
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

const sidebarLinks = [
  { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
  { to: '/admin/branches', icon: FiMapPin, label: 'Chi nhánh' },
  { to: '/admin/services', icon: FiScissors, label: 'Dịch vụ' },
  { to: '/admin/products', icon: FiBox, label: 'Sản phẩm' },
  { to: '/admin/staff', icon: FiUsers, label: 'Nhân viên' },
  { to: '/admin/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
  { to: '/admin/vouchers', icon: FiTag, label: 'Khuyến mãi' },
  { to: '/admin/payments', icon: FiCreditCard, label: 'Thanh toán' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[var(--text-gray)]">
            <FiX size={20} />
          </button>
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
            className="lg:hidden p-2 text-[var(--text-gray)]"
          >
            <FiMenu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--text-dark)]">
              {user?.fullName || user?.name || 'Quản trị viên'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--error)] hover:bg-red-50 rounded-lg transition-colors"
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

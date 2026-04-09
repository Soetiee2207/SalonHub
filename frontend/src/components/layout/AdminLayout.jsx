import { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiMapPin, FiScissors, FiBox, FiUsers,
  FiShoppingBag, FiCalendar, FiTag, FiCreditCard,
  FiMenu, FiX, FiLogOut, FiArrowLeft, FiPackage, FiDollarSign, FiStar,
  FiTruck, FiClipboard, FiRefreshCw, FiFileText, FiBell
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { notificationService } from '../../services/notificationService';

// Sidebar links per role
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
  ],
  accountant: [
    { to: '/admin', icon: FiGrid, label: 'Dashboard', exact: true },
    { to: '/admin/orders', icon: FiShoppingBag, label: 'Đơn hàng' },
    { to: '/admin/reconciliation', icon: FiCreditCard, label: 'Đối soát VNPAY/COD' },
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const role = user?.role || 'staff';

  const fetchUnreadCount = () => {
    notificationService.getUnreadCount()
      .then(res => {
        const count = res.data?.totalUnread || res.totalUnread || 0;
        setUnreadCount(count);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, location.pathname]);

  const socket = useSocket();

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', fetchUnreadCount);
      socket.on('new_role_notification', fetchUnreadCount);

      return () => {
        socket.off('new_notification', fetchUnreadCount);
        socket.off('new_role_notification', fetchUnreadCount);
      };
    }
  }, [socket]);
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
            {/* Notification Bell */}
            <Link 
              to="/notifications" 
              className="relative p-2 text-[var(--text-gray)] hover:text-[var(--text-dark)] transition-colors mr-2"
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
            </Link>

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

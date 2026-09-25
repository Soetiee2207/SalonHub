import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatbotWidget from '../common/ChatbotWidget';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Chỉ chuyển hướng nhân viên nội bộ về /admin nếu họ truy cập vào trang quản lý đơn/giỏ riêng của khách
  const customerOnlyRoutes = ['/profile', '/my-appointments', '/my-orders', '/my-addresses', '/cart', '/checkout'];
  if (user && user.role !== 'admin' && user.role !== 'customer' && customerOnlyRoutes.some(r => location.pathname.startsWith(r))) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatbotWidget />
    </div>
  );
}

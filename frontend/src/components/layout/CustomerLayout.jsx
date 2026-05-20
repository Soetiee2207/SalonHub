import { Outlet, Navigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatbotWidget from '../common/ChatbotWidget';
import { useAuth } from '../../contexts/AuthContext';

export default function CustomerLayout() {
  const { user } = useAuth();

  // Nếu người dùng đã đăng nhập và có role KHÔNG phải là admin hoặc customer, 
  // thì chuyển hướng trực tiếp họ về màn hình làm việc /admin
  if (user && user.role !== 'admin' && user.role !== 'customer') {
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

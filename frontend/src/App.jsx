import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import CustomerLayout from './components/layout/CustomerLayout';
import AdminLayout from './components/layout/AdminLayout';

import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner';

// Customer pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Profile = lazy(() => import('./pages/auth/Profile'));
const Services = lazy(() => import('./pages/services/Services'));
const ServiceDetail = lazy(() => import('./pages/services/ServiceDetail'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductDetail = lazy(() => import('./pages/products/ProductDetail'));
const Cart = lazy(() => import('./pages/cart/Cart'));
const Checkout = lazy(() => import('./pages/cart/Checkout'));
const BookAppointment = lazy(() => import('./pages/appointments/BookAppointment'));
const MyAppointments = lazy(() => import('./pages/appointments/MyAppointments'));
const MyOrders = lazy(() => import('./pages/orders/MyOrders'));
const OrderDetail = lazy(() => import('./pages/orders/OrderDetail'));
const Notifications = lazy(() => import('./pages/notifications/Notifications'));
const VnpayReturn = lazy(() => import('./pages/payments/VnpayReturn'));
const MyAddresses = lazy(() => import('./pages/addresses/MyAddresses'));
const Contact = lazy(() => import('./pages/Contact'));

// Admin pages
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const StaffDashboard = lazy(() => import('./pages/admin/StaffDashboard'));
const WarehouseDashboard = lazy(() => import('./pages/admin/WarehouseDashboard'));
const AccountantDashboard = lazy(() => import('./pages/admin/AccountantDashboard'));
const AdminBranches = lazy(() => import('./pages/admin/Branches'));
const AdminServices = lazy(() => import('./pages/admin/Services'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminStaff = lazy(() => import('./pages/admin/Staff'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminAppointments = lazy(() => import('./pages/admin/Appointments'));
const AdminVouchers = lazy(() => import('./pages/admin/Vouchers'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminReviews = lazy(() => import('./pages/admin/Reviews'));
const Fulfillment = lazy(() => import('./pages/admin/Fulfillment'));
const InventoryGrid = lazy(() => import('./pages/admin/InventoryGrid'));
const WarehouseInventoryDocs = lazy(() => import('./pages/admin/WarehouseInventoryDocs'));
const CashFlowLedger = lazy(() => import('./pages/admin/CashFlowLedger'));
const PaymentReconciliation = lazy(() => import('./pages/admin/PaymentReconciliation'));
const RefundHub = lazy(() => import('./pages/admin/RefundHub'));
const FinancialReports = lazy(() => import('./pages/admin/FinancialReports'));



function RoleDashboard() {
  const { user } = useAuth();
  const role = user?.role;

  if (role === 'warehouse_staff') return <WarehouseDashboard />;
  if (role === 'accountant') return <AccountantDashboard />;
  if (role === 'staff' || role === 'service_staff') return <StaffDashboard />;
  return <Dashboard />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Customer Routes */}
              <Route element={<CustomerLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:id" element={<ServiceDetail />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/vnpay-return" element={<VnpayReturn />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/book-appointment" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
                <Route path="/my-appointments" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
                <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/my-orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                <Route path="/my-addresses" element={<ProtectedRoute><MyAddresses /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              </Route>

              {/* Admin/Staff Routes — all management roles */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute roles={['admin', 'staff', 'service_staff', 'warehouse_staff', 'accountant']}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<RoleDashboard />} />
                <Route path="branches" element={<AdminBranches />} />
                <Route path="services" element={<AdminServices />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="staff" element={<AdminStaff />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="appointments" element={<AdminAppointments />} />
                <Route path="vouchers" element={<AdminVouchers />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="fulfillment" element={<Fulfillment />} />
                <Route path="inventory" element={<InventoryGrid />} />
                <Route path="inventory-docs" element={<WarehouseInventoryDocs />} />
                <Route path="cash-ledger" element={<CashFlowLedger />} />
                <Route path="reconciliation" element={<PaymentReconciliation />} />
                <Route path="refunds" element={<RefundHub />} />
                <Route path="reports" element={<FinancialReports />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

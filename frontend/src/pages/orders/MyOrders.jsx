import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { formatPrice } from '../../utils/formatPrice';

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  shipping: { label: 'Đang giao', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const paymentStatusConfig = {
  pending: { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Thất bại', color: 'bg-red-100 text-red-700' },
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    orderService.getMyOrders()
      .then((res) => setOrders(res.data || res))
      .catch(() => toast.error('Không thể tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    setCancelling(orderId);
    try {
      await orderService.cancel(orderId);
      toast.success('Đã hủy đơn hàng thành công');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">Đơn hàng của tôi</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <FiPackage className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-lg text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending;
            const itemCount = order.items?.length || 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-500">
                        Mã đơn: <span className="font-mono font-medium text-gray-700">#{String(order.id).padStart(6, '0')}</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${paymentStatus.color}`}>
                        {paymentStatus.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{itemCount} sản phẩm</span>
                      <span className="text-gray-300">|</span>
                      <span>
                        {order.paymentMethod === 'vnpay' ? 'VNPay' : 'COD'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-[var(--primary)]">
                      {formatPrice(order.totalAmount || 0)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    {order.status === 'pending' ? (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelling === order.id}
                        className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        <FiXCircle size={16} />
                        {cancelling === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                      </button>
                    ) : (
                      <div />
                    )}
                    <Link
                      to={`/my-orders/${order.id}`}
                      className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline font-medium"
                    >
                      Xem chi tiết
                      <FiChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

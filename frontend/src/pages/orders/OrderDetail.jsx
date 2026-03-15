import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiXCircle, FiMapPin, FiPhone } from 'react-icons/fi';
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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    orderService.getById(id)
      .then((res) => setOrder(res.data || res))
      .catch(() => toast.error('Không thể tải thông tin đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      await orderService.cancel(id);
      toast.success('Đã hủy đơn hàng thành công');
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      toast.error(err.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">
        <p className="text-lg">Không tìm thấy đơn hàng</p>
        <Link to="/my-orders" className="text-[var(--primary)] hover:underline mt-2 inline-block">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending;
  const items = order.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const discountAmount = order.discount || (subtotal - (order.totalAmount || 0));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/my-orders"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-6"
      >
        <FiArrowLeft /> Quay lại đơn hàng
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--primary)]">Chi tiết đơn hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mã đơn: <span className="font-mono font-medium">#{String(order.id).padStart(6, '0')}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${status.color}`}>
            {status.label}
          </span>
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${paymentStatus.color}`}>
            {paymentStatus.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ngày đặt</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Phương thức thanh toán</p>
                <p className="font-medium">
                  {order.paymentMethod === 'vnpay' ? 'VNPay' : 'Thanh toán khi nhận hàng'}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin giao hàng</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <FiMapPin className="text-[var(--primary)]" size={16} />
                <span>{order.address || 'Không có thông tin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiPhone className="text-[var(--primary)]" size={16} />
                <span>{order.phone || 'Không có thông tin'}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 pb-0">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Sản phẩm đã đặt</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-sm font-medium text-gray-500 px-6 py-3">Sản phẩm</th>
                    <th className="text-center text-sm font-medium text-gray-500 px-4 py-3">Số lượng</th>
                    <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">Đơn giá</th>
                    <th className="text-right text-sm font-medium text-gray-500 px-6 py-3">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {item.product?.name || item.name || 'Sản phẩm'}
                      </td>
                      <td className="px-4 py-4 text-sm text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-4 text-sm text-right text-gray-600">
                        {formatPrice(item.price || 0)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-medium text-gray-800">
                        {formatPrice((item.price || 0) * (item.quantity || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tổng kết</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá (voucher)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-100">
                <span>Tổng cộng</span>
                <span className="text-[var(--primary)]">{formatPrice(order.totalAmount || 0)}</span>
              </div>
            </div>

            {order.status === 'pending' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors font-medium disabled:opacity-50"
              >
                <FiXCircle size={18} />
                {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

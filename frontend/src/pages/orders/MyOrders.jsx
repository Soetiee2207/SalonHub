import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiXCircle, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import { formatPrice } from '../../utils/formatPrice';
import ReviewModal from '../../components/common/ReviewModal';

const statusConfig = {
  pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  packing: { label: 'Đang đóng gói', color: 'bg-indigo-100 text-indigo-700' },
  shipping: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-700 font-bold' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const paymentStatusConfig = {
  pending: { label: 'Chưa thanh toán', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Đã thanh toán', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Thất bại', color: 'bg-red-100 text-red-700' },
};

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1597854710218-d2f1064e3b3e?w=400&q=80';

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'wait_payment', label: 'Chờ thanh toán' },
  { id: 'wait_confirm', label: 'Chờ xác nhận' },
  { id: 'packing', label: 'Đóng gói' },
  { id: 'shipping', label: 'Vận chuyển' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'refund', label: 'Trả hàng/Hoàn tiền' },
  { id: 'review', label: 'Chờ đánh giá' }
];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const handleConfirmReceipt = async (orderId) => {
    if (!window.confirm('Vận tiêu đã tới đích? Sư huynh xác nhận đã nhận được hàng chứ?')) return;
    setConfirming(orderId);
    try {
      await orderService.confirmReceipt(orderId);
      toast.success('Chúc mừng sư huynh đã hoàn thành vận tiêu!');
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Không thể xác nhận nhận hàng');
    } finally {
      setConfirming(null);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewProduct) return;
    setSubmittingReview(true);
    try {
      await reviewService.createProductReview({
        productId: reviewProduct.id,
        rating,
        comment,
      });
      toast.success('Cảm ơn bạn đã đánh giá sản phẩm!');
      setReviewProduct(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message || 'Gửi đánh giá thất bại');
    } finally {
      setSubmittingReview(false);
    }
  };

  const unreviewedItems = orders.reduce((acc, order) => {
    if (['completed', 'delivered'].includes(order.status)) {
      order.items?.forEach(item => {
        if (!item.isReviewed) {
          acc.push({
            ...item,
            orderId: order.id,
            orderDate: order.createdAt
          });
        }
      });
    }
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const filteredOrders = orders.filter(order => {
    switch (activeTab) {
      case 'wait_payment':
        return order.paymentStatus === 'pending' && order.paymentMethod !== 'cod' && order.status !== 'cancelled';
      case 'wait_confirm':
        return (order.status === 'pending' || order.status === 'confirmed') && !(order.paymentStatus === 'pending' && order.paymentMethod !== 'cod');
      case 'packing':
        return order.status === 'packing';
      case 'shipping':
        return order.status === 'shipping';
      case 'completed':
        return order.status === 'delivered' || order.status === 'completed';
      case 'cancelled':
        return order.status === 'cancelled' && order.paymentStatus !== 'paid';
      case 'refund':
        return order.status === 'cancelled' && order.paymentStatus === 'paid';
      case 'all':
      default:
        return true;
    }
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">Đơn hàng của tôi</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 pb-2 border-b border-gray-100">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 rounded-t-lg ${
              activeTab === tab.id
                ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--bg-warm)]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
            {tab.id === 'review' && unreviewedItems.length > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-[10px] w-5 h-5 rounded-full inline-flex items-center justify-center">
                {unreviewedItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'review' ? (
        <div className="space-y-4">
          {unreviewedItems.length === 0 ? (
            <div className="text-center py-16">
              <FiStar className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-lg text-gray-500 mb-4">Bạn không có sản phẩm nào cần đánh giá</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unreviewedItems.map((item, idx) => (
                <div key={`${item.orderId}-${item.productId}-${idx}`} className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between hover:border-orange-200 transition-colors">
                  <div className="flex items-center flex-1 pr-4 min-w-0 gap-3">
                    <img 
                      src={item.product?.image || PRODUCT_FALLBACK} 
                      alt={item.product?.name || 'Product'} 
                      className="w-12 h-12 object-cover rounded-md border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.productId}`} className="font-medium text-gray-800 hover:text-[var(--primary)] text-sm truncate block">
                        {item.product?.name || item.name || 'Sản phẩm'}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">Đơn hàng #{String(item.orderId).padStart(6, '0')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReviewProduct({ id: item.productId, name: item.product?.name || item.name })}
                    className="shrink-0 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold rounded-lg hover:from-orange-500 hover:to-orange-600 transition-all shadow-sm"
                  >
                    Đánh giá ngay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <FiPackage className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-lg text-gray-500 mb-4">
                {activeTab === 'all' ? 'Bạn chưa có đơn hàng nào' : 'Không có đơn hàng nào trong phân loại này'}
              </p>
              {activeTab === 'all' && (
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors"
                >
                  Mua sắm ngay
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
          {filteredOrders.map((order) => {
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

                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelling === order.id}
                            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                          >
                            <FiXCircle size={16} />
                            {cancelling === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                          </button>
                        )}
                        {['shipping', 'delivered'].includes(order.status) && (
                          <button
                            onClick={() => handleConfirmReceipt(order.id)}
                            disabled={confirming === order.id}
                            className="flex items-center gap-1.5 text-sm bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 font-bold"
                          >
                            {confirming === order.id ? 'Đang xác nhận...' : 'Đã nhận hàng'}
                          </button>
                        )}
                        <div className="flex-1" />
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
        </>
      )}

      <ReviewModal
        isOpen={!!reviewProduct}
        title="Đánh giá sản phẩm"
        subtitle={reviewProduct?.name}
        onClose={() => setReviewProduct(null)}
        onSubmit={handleReviewSubmit}
        submitting={submittingReview}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';
import { formatPrice } from '../../utils/formatPrice';

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchCart = () => {
    setLoading(true);
    cartService.getCart()
      .then((res) => setCart(res.data || res))
      .catch(() => toast.error('Không thể tải giỏ hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdating(itemId);
    try {
      await cartService.updateItem(itemId, { quantity: newQuantity });
      fetchCart();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật số lượng');
    } finally {
      setUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartService.removeItem(itemId);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
      fetchCart();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleClearCart = async () => {
    try {
      await cartService.clearCart();
      toast.success('Đã xóa tất cả sản phẩm');
      setCart(null);
      fetchCart();
    } catch (err) {
      toast.error(err.message || 'Không thể xóa giỏ hàng');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <FiShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h1>
        <p className="text-gray-500 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors"
        >
          <FiShoppingBag />
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[var(--primary)]">Giỏ hàng</h1>
        <button
          onClick={handleClearCart}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
          <FiTrash2 size={16} />
          Xóa tất cả
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product?.image || '/placeholder-product.png'}
                  alt={item.product?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/products/${item.product?.id}`}
                  className="font-semibold text-gray-800 hover:text-[var(--primary)] line-clamp-1"
                >
                  {item.product?.name}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  Đơn giá: {formatPrice(item.product?.price || 0)}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={updating === item.id || item.quantity <= 1}
                      className="px-2 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <FiMinus size={14} />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={updating === item.id}
                      className="px-2 py-1 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      <FiPlus size={14} />
                    </button>
                  </div>
                  <p className="font-bold text-[var(--primary)]">
                    {formatPrice((item.product?.price || 0) * item.quantity)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                className="text-gray-400 hover:text-red-500 transition-colors self-start p-1"
              >
                <FiTrash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tóm tắt đơn hàng</h2>
            <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tạm tính ({items.length} sản phẩm)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold mb-6">
              <span>Tổng cộng</span>
              <span className="text-[var(--primary)]">{formatPrice(subtotal)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium"
            >
              Tiến hành thanh toán
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

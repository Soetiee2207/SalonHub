import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiTag, FiCreditCard, FiTruck, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { voucherService } from '../../services/voucherService';
import { formatPrice } from '../../utils/formatPrice';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  useEffect(() => {
    cartService.getCart()
      .then((res) => {
        const data = res.data || res;
        setCart(data);
        if (!data?.items?.length) {
          toast.error('Giỏ hàng trống');
          navigate('/cart');
        }
      })
      .catch(() => {
        toast.error('Không thể tải giỏ hàng');
        navigate('/cart');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const items = cart?.items || [];
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );
  const total = Math.max(0, subtotal - discount);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    setApplyingVoucher(true);
    try {
      const res = await voucherService.validate({ code: voucherCode, orderAmount: subtotal });
      const data = res.data || res;
      setDiscount(data.discount || 0);
      setVoucherApplied(true);
      toast.success(`Áp dụng mã giảm giá thành công! Giảm ${formatPrice(data.discount || 0)}`);
    } catch (err) {
      toast.error(err.message || 'Mã giảm giá không hợp lệ');
      setDiscount(0);
      setVoucherApplied(false);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng');
      return;
    }
    if (!phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        address,
        phone,
        paymentMethod,
      };
      if (voucherApplied && voucherCode) {
        orderData.voucherCode = voucherCode;
      }

      const res = await orderService.create(orderData);
      const data = res.data || res;

      if (paymentMethod === 'vnpay' && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast.success('Đặt hàng thành công!');
        navigate('/my-orders');
      }
    } catch (err) {
      toast.error(err.message || 'Không thể đặt hàng');
    } finally {
      setSubmitting(false);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-[var(--primary)] hover:underline mb-6"
      >
        <FiArrowLeft /> Quay lại giỏ hàng
      </Link>

      <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">Thanh toán</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Info */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin giao hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin size={16} />
                    Địa chỉ giao hàng
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ giao hàng đầy đủ..."
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <FiPhone size={16} />
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Voucher */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Mã giảm giá</h2>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value.toUpperCase());
                      if (voucherApplied) {
                        setVoucherApplied(false);
                        setDiscount(0);
                      }
                    }}
                    placeholder="Nhập mã giảm giá..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyVoucher}
                  disabled={applyingVoucher}
                  className="px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                >
                  {applyingVoucher ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>
              {voucherApplied && (
                <p className="text-green-600 text-sm mt-2">
                  Đã áp dụng mã giảm giá. Giảm {formatPrice(discount)}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-[var(--primary)] bg-[var(--bg-light)]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-[var(--primary)]"
                  />
                  <FiTruck className="text-[var(--primary)]" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</p>
                    <p className="text-sm text-gray-500">Trả tiền mặt khi nhận hàng</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === 'vnpay' ? 'border-[var(--primary)] bg-[var(--bg-light)]' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="accent-[var(--primary)]"
                  />
                  <FiCreditCard className="text-[var(--primary)]" size={20} />
                  <div>
                    <p className="font-medium text-gray-800">Thanh toán trực tuyến (VNPay)</p>
                    <p className="text-sm text-gray-500">Thanh toán qua cổng thanh toán VNPay</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Đơn hàng của bạn</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex-1 pr-2 line-clamp-1">
                      {item.product?.name} x{item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      {formatPrice((item.product?.price || 0) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-[var(--primary)]">{formatPrice(total)}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

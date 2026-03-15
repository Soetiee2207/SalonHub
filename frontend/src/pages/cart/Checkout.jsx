import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMapPin, FiPhone, FiTag, FiCreditCard, FiTruck, FiArrowLeft, FiPlus, FiCheck, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { cartService } from '../../services/cartService';
import { orderService } from '../../services/orderService';
import { voucherService } from '../../services/voucherService';
import { addressService } from '../../services/addressService';
import { formatPrice } from '../../utils/formatPrice';
import AddressForm from '../../components/address/AddressForm';

export default function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await addressService.getAll();
      const data = res.data?.data || res.data || [];
      setAddresses(data);
      const defaultAddr = data.find(a => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (data.length > 0) setSelectedAddressId(data[0].id);
    } catch {}
  };

  useEffect(() => {
    Promise.all([
      cartService.getCart(),
      fetchAddresses(),
    ]).then(([cartRes]) => {
      const data = cartRes.data || cartRes;
      setCart(data);
      if (!data?.items?.length) {
        toast.error('Giỏ hàng trống');
        navigate('/cart');
      }
    }).catch(() => {
      toast.error('Không thể tải giỏ hàng');
      navigate('/cart');
    }).finally(() => setLoading(false));
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
      const discountValue = data.discountAmount || 0;
      setDiscount(discountValue);
      setVoucherApplied(true);
      toast.success(`Áp dụng mã giảm giá thành công! Giảm ${formatPrice(discountValue)}`);
    } catch (err) {
      toast.error(err.message || 'Mã giảm giá không hợp lệ');
      setDiscount(0);
      setVoucherApplied(false);
    } finally {
      setApplyingVoucher(false);
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = `${selectedAddress.street}, ${selectedAddress.wardName}, ${selectedAddress.districtName}, ${selectedAddress.provinceName}`;
      const orderData = {
        address: fullAddress,
        phone: selectedAddress.phone,
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
            {/* Delivery Address */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">Địa chỉ giao hàng</h2>
                <button
                  type="button"
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline font-medium"
                >
                  <FiPlus size={14} /> Thêm mới
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiMapPin size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm mb-3">Bạn chưa có địa chỉ nào</p>
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(true)}
                    className="px-4 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    Thêm địa chỉ
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-[var(--primary)] bg-[var(--bg-light)]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="accent-[var(--primary)] mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">{addr.fullName}</span>
                          <span className="text-sm text-gray-500">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="text-xs text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <FiCheck size={10} /> Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {addr.street}, {addr.wardName}, {addr.districtName}, {addr.provinceName}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
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

      {showAddressForm && (
        <AddressForm
          address={null}
          onClose={() => setShowAddressForm(false)}
          onSaved={() => {
            setShowAddressForm(false);
            fetchAddresses();
          }}
        />
      )}
    </div>
  );
}

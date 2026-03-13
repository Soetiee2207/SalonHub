import { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { formatPrice } from '../../utils/formatPrice';

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();

  const result = useMemo(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');
    const amount = searchParams.get('vnp_Amount');

    return {
      isSuccess: responseCode === '00',
      responseCode,
      txnRef,
      amount: amount ? Number(amount) / 100 : null,
    };
  }, [searchParams]);

  // Forward the query params to backend for server-side verification
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryString = window.location.search;
        await fetch(`/api/payments/vnpay-return${queryString}`);
      } catch (err) {
        // Backend IPN will handle it as backup
      }
    };
    verifyPayment();
  }, []);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${result.isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
        {result.isSuccess ? (
          <FiCheckCircle className="text-green-500" size={40} />
        ) : (
          <FiXCircle className="text-red-500" size={40} />
        )}
      </div>

      <h1 className={`text-2xl font-bold mb-2 ${result.isSuccess ? 'text-green-600' : 'text-red-600'}`}>
        {result.isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
      </h1>

      <p className="text-gray-500 mb-6">
        {result.isSuccess
          ? 'Đơn hàng của bạn đã được thanh toán thành công. Cảm ơn bạn đã mua hàng!'
          : 'Thanh toán không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
      </p>

      {result.txnRef && (
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500">Mã giao dịch</span>
            <span className="font-mono font-medium">{result.txnRef}</span>
          </div>
          {result.amount && (
            <div className="flex justify-between">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-medium text-[var(--primary)]">{formatPrice(result.amount)}</span>
            </div>
          )}
          {result.responseCode && !result.isSuccess && (
            <div className="flex justify-between mt-2">
              <span className="text-gray-500">Mã lỗi</span>
              <span className="font-mono text-red-500">{result.responseCode}</span>
            </div>
          )}
        </div>
      )}

      <Link
        to="/my-orders"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors font-medium"
      >
        Xem đơn hàng của tôi
        <FiArrowRight />
      </Link>
    </div>
  );
}

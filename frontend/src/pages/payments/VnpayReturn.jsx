import { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiArrowRight } from 'react-icons/fi';
import { formatPrice } from '../../utils/formatPrice';

export default function VnpayReturn() {
  const [searchParams] = useSearchParams();

  const result = useMemo(() => {
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef') || '';
    const amount = searchParams.get('vnp_Amount');

    const type = txnRef.startsWith('APP_') ? 'appointment' : 'order';

    return {
      isSuccess: responseCode === '00',
      responseCode,
      txnRef,
      amount: amount ? Number(amount) / 100 : null,
      type
    };
  }, [searchParams]);

  // Forward the query params to backend for server-side verification
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const queryString = window.location.search;
        // Verify via backend return endpoint
        await fetch(`/api/payments/vnpay-return${queryString}`);
      } catch (err) {
        console.error('Verification error:', err);
      }
    };
    verifyPayment();
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gray-50/50">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-10 text-center border border-slate-100 animate-scale-up">
        {/* Status Icon */}
        <div className={`w-24 h-24 mx-auto mb-8 rounded-full flex items-center justify-center ${result.isSuccess ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
          {result.isSuccess ? (
            <FiCheckCircle size={48} className="animate-bounce-short" />
          ) : (
            <FiXCircle size={48} />
          )}
        </div>

        {/* Message */}
        <h1 className={`text-3xl font-black mb-4 uppercase tracking-tighter ${result.isSuccess ? 'text-slate-800' : 'text-rose-600'}`}>
          {result.isSuccess ? 'Thanh toán Khớp!' : 'Có lỗi xảy ra'}
        </h1>

        <p className="text-slate-400 text-sm font-medium mb-10 px-4 leading-relaxed">
          {result.isSuccess
            ? 'Giao dịch của bạn đã được hệ thống xác nhận thành công. Chào mừng bạn đến với trải nghiệm Luxury tại SalonHub!'
            : 'Rất tiếc, giao dịch không thể hoàn tất lúc này. Vui lòng kiểm tra lại tài khoản hoặc liên hệ bộ phận CSKH.'}
        </p>

        {/* Detail Box */}
        {result.txnRef && (
          <div className="bg-slate-50 rounded-3xl p-6 mb-10 text-left space-y-3 border border-slate-100/50">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
              <span>Mã tham chiếu</span>
              <span className="text-slate-600">{result.txnRef}</span>
            </div>
            {result.amount && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng giá trị</span>
                <span className="text-lg font-black text-[#8B5E3C]">{formatPrice(result.amount)}</span>
              </div>
            )}
            {!result.isSuccess && result.responseCode && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Mã lỗi</span>
                <span className="text-xs font-bold text-rose-500">{result.responseCode}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <Link
          to={result.type === 'appointment' ? '/my-appointments' : '/my-orders'}
          className="group flex items-center justify-center gap-3 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#8B5E3C] transition-all transform hover:-translate-y-1 shadow-xl shadow-slate-200"
        >
          {result.type === 'appointment' ? 'Xem lịch hẹn' : 'Kiểm tra đơn hàng'}
          <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <Link to="/" className="inline-block mt-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-[#8B5E3C] transition-colors">
           Quay về trang chủ
        </Link>
      </div>
    </div>
  );
}

import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/formatPrice';
import { useSocket } from '../../contexts/SocketContext';

export default function BankTransferModal({ isOpen, onClose, amount, orderId, apptId }) {
  const navigate = useNavigate();
  const socket = useSocket();
  const [copiedField, setCopiedField] = useState(null);

  // Auto-redirect on payment success
  useEffect(() => {
    if (socket && isOpen) {
      const handlePaymentSuccess = (data) => {
        // Match either order or appointment
        const isMatch = (orderId && data.type === 'ORDER' && Number(data.id) === Number(orderId)) ||
                        (apptId && data.type === 'APP' && Number(data.id) === Number(apptId));

        if (isMatch) {
          toast.success('Thanh toán thành công! Đang chuyển hướng...');
          setTimeout(() => {
            onClose();
            if (data.type === 'ORDER') {
              navigate(`/my-orders/${data.id}`);
            } else {
              navigate('/my-appointments');
            }
          }, 2000);
        }
      };

      socket.on('payment_success', handlePaymentSuccess);
      return () => socket.off('payment_success', handlePaymentSuccess);
    }
  }, [socket, isOpen, orderId, apptId, navigate, onClose]);

  if (!isOpen) return null;

  const bankInfo = {
    bankName: 'TPBank (Ngân hàng Tiên Phong)',
    accountNumber: '88886352274',
    accountName: 'NGUYEN NHAT MINH',
    bankId: 'TPB'
  };

  const content = orderId ? `SH${orderId}` : `AP${apptId}`;
  
  // Generating VietQR URL
  const qrUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png?amount=${amount}&addInfo=${content}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Đã sao chép');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-[400px] shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-6 bg-[#8B5E3C] text-white flex items-center justify-between">
          <h2 className="text-xl font-bold font-display">Thanh toán chuyển khoản</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors border-0 bg-transparent text-white cursor-pointer">
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-2.5 bg-white border-4 border-slate-50 rounded-3xl shadow-sm">
              <img src={qrUrl} alt="VietQR" className="w-56 h-56 object-contain" />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Quét mã để thanh toán nhanh</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngân hàng</p>
                  <p className="text-sm font-bold text-slate-700">{bankInfo.bankName}</p>
                </div>
              </div>

              <div className="flex justify-between items-center group">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Số tài khoản</p>
                  <p className="text-lg font-black text-[#8B5E3C] tracking-tight">{bankInfo.accountNumber}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(bankInfo.accountNumber, 'acc')}
                  className="p-2 bg-white text-slate-400 hover:text-[#8B5E3C] rounded-lg border border-slate-100 transition-all cursor-pointer"
                >
                  {copiedField === 'acc' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chủ tài khoản</p>
                  <p className="text-sm font-bold text-slate-700">{bankInfo.accountName}</p>
                </div>
              </div>

              <div className="flex justify-between items-center group border-t border-dashed border-slate-200 pt-3">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Số tiền</p>
                  <p className="text-lg font-black text-slate-800">{formatPrice(amount)}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(amount.toString(), 'amount')}
                  className="p-2 bg-white text-slate-400 hover:text-[#8B5E3C] rounded-lg border border-slate-100 transition-all cursor-pointer"
                >
                  {copiedField === 'amount' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>

              <div className="flex justify-between items-center group bg-amber-50 p-3 rounded-xl border border-amber-100">
                <div>
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Nội dung chuyển khoản</p>
                  <p className="text-lg font-black text-amber-700 uppercase tracking-tight">{content}</p>
                </div>
                <button 
                  onClick={() => copyToClipboard(content, 'content')}
                  className="p-2 bg-white text-amber-500 hover:bg-amber-500 hover:text-white rounded-lg border border-amber-200 transition-all cursor-pointer"
                >
                  {copiedField === 'content' ? <FiCheck size={16} /> : <FiCopy size={16} />}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 flex gap-3">
              <div className="text-blue-500 mt-0.5">
                <FiCheck size={16} />
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Hệ thống xác nhận tự động sau 1-3 phút. Vui lòng <strong>giữ nguyên nội dung chuyển khoản</strong>.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#8B5E3C] text-white font-black text-sm shadow-xl shadow-[#8B5E3C]/20 hover:bg-[#6D492E] transition-all cursor-pointer border-0"
          >
            ĐÃ CHUYỂN KHOẢN (ĐÓNG)
          </button>
        </div>
      </div>
    </div>
  );
}

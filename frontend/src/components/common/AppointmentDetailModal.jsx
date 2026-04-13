import React from 'react';
import { 
  FiX, FiCalendar, FiClock, FiMapPin, 
  FiUser, FiDollarSign, FiInfo, FiHash,
  FiShoppingBag, FiCheckCircle, FiAlertCircle, FiStar
} from 'react-icons/fi';
import { formatPrice } from '../../utils/formatPrice';

const STATUS_MAP = {
  awaiting_deposit: { label: 'Chờ đặt cọc', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: FiClock },
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FiAlertCircle },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiCheckCircle },
  in_progress: { label: 'Đang thực hiện', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiUser },
  completed: { label: 'Hoàn thành', color: 'bg-green-50 text-green-700 border-green-200', icon: FiCheckCircle },
  cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 border-red-200', icon: FiX },
};

const DEPOSIT_STATUS_MAP = {
  pending: { label: 'Chưa thanh toán', color: 'text-amber-600' },
  paid: { label: 'Đã thanh toán', color: 'text-green-600' },
  refunded: { label: 'Đã hoàn tiền', color: 'text-gray-500' },
};

const AppointmentDetailModal = ({ isOpen, appointment, onClose, onCancel, onPayDeposit, onReview }) => {
  if (!isOpen || !appointment) return null;

  const status = STATUS_MAP[appointment.status] || STATUS_MAP.pending;
  const StatusIcon = status.icon;
  
  const canCancel = ['awaiting_deposit', 'pending', 'confirmed'].includes(appointment.status);
  const canPayDeposit = appointment.status === 'awaiting_deposit' && appointment.depositStatus === 'pending';
  const canReview = appointment.status === 'completed' && !appointment.reviewed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-[#8B5E3C] to-[#A67C52] p-6 flex items-end">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <FiX size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg text-[#8B5E3C]">
              <FiShoppingBag size={32} />
            </div>
            <div>
              <h2 className="text-white font-black text-xl leading-tight">Chi tiết lịch hẹn</h2>
              <p className="text-white/80 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                <FiHash className="text-xs" /> Mã lịch: AP{appointment.id}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wider mb-6 ${status.color}`}>
            <StatusIcon size={14} />
            {status.label}
          </div>

          <div className="space-y-6">
            {/* Service & Staff Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dịch vụ</p>
                <p className="font-bold text-gray-800">{appointment.service?.name}</p>
                <p className="text-xs text-gray-500 font-medium">{appointment.service?.duration} phút</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chuyên viên</p>
                <div className="flex items-center justify-end gap-2">
                  <p className="font-bold text-gray-800">{appointment.staff?.fullName}</p>
                  {appointment.staff?.avatar ? (
                    <img src={appointment.staff.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                      <FiUser size={12} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Time & Branch */}
            <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-[#8B5E3C]">
                  <FiCalendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thời gian</p>
                  <p className="font-bold text-gray-800">
                    {appointment.startTime} - {new Date(appointment.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                  <FiMapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Địa điểm</p>
                  <p className="font-bold text-gray-800">{appointment.branch?.name}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{appointment.branch?.address}</p>
                </div>
              </div>
            </div>

            {/* Payment & Deposit Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <FiDollarSign className="text-[#8B5E3C]" />
                Chi tiết thanh toán
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Tổng giá dịch vụ</span>
                  <span className="font-bold text-gray-800">{formatPrice(appointment.totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span className="flex items-center gap-1.5 italic">
                    <FiInfo size={12} className="text-blue-500" />
                    Số tiền đã đặt cọc (100%)
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-[#8B5E3C]">{formatPrice(appointment.depositAmount || appointment.totalPrice)}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-tight ${DEPOSIT_STATUS_MAP[appointment.depositStatus]?.color || ''}`}>
                      {DEPOSIT_STATUS_MAP[appointment.depositStatus]?.label || 'Chưa rõ'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Note */}
            {appointment.note && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <FiInfo size={10} /> Ghi chú của bạn
                </p>
                <p className="text-sm text-orange-800/80 leading-relaxed">{appointment.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {canCancel && (
              <button
                onClick={() => { onClose(); onCancel(appointment.id); }}
                className="px-4 py-2 text-sm font-bold text-red-500 border border-red-100 bg-white rounded-xl hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2"
              >
                <FiX size={14} /> Hủy lịch
              </button>
            )}
            {canReview && (
              <button
                onClick={() => { onClose(); onReview(appointment); }}
                className="px-4 py-2 text-sm font-bold text-[var(--primary)] border border-[var(--primary)] rounded-xl hover:bg-white transition-all flex items-center gap-2"
              >
                <FiStar size={14} /> Đánh giá
              </button>
            )}
          </div>
          
          {canPayDeposit ? (
            <button
              onClick={() => { onClose(); onPayDeposit(appointment); }}
              className="flex-1 max-w-[160px] px-4 py-2.5 text-sm font-black text-white bg-gradient-to-r from-[#8B5E3C] to-[#A67C52] rounded-xl shadow-[0_4px_12px_rgba(139,94,60,0.3)] hover:shadow-[0_6px_16px_rgba(139,94,60,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <FiDollarSign size={16} /> ĐẶT CỌC NGAY
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-black text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
            >
              ĐÓNG
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;

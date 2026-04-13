import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiMapPin, FiUser, FiX, FiStar, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { appointmentService } from '../../services/appointmentService';
import { reviewService } from '../../services/reviewService';
import { formatPrice } from '../../utils/formatPrice';
import ReviewModal from '../../components/common/ReviewModal';
import BankTransferModal from '../../components/common/BankTransferModal';

const STATUS_MAP = {
  awaiting_deposit: { label: 'Chờ đặt cọc', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'Đang thực hiện', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700 border-red-200' },
};

const FILTER_TABS = [
  { key: null, label: 'Tất cả' },
  { key: 'awaiting_deposit', label: 'Chờ đặt cọc' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'in_progress', label: 'Đang thực hiện' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // appointment object
  const [submittingReview, setSubmittingReview] = useState(false);
  const [depositPayAppt, setDepositPayAppt] = useState(null); // appointment to pay deposit

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyAppointments();
      setAppointments(res.data || res);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách lịch hẹn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;
    try {
      await appointmentService.cancel(id);
      toast.success('Đã hủy lịch hẹn.');
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Hủy lịch hẹn thất bại.');
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!reviewModal) return;
    setSubmittingReview(true);
    try {
      await reviewService.createServiceReview({
        appointmentId: reviewModal.id,
        rating,
        comment,
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      setReviewModal(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Gửi đánh giá thất bại.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filtered = statusFilter
    ? appointments.filter((a) => a.status === statusFilter)
    : appointments;

  const getServiceName = (a) => a.service?.name || a.serviceId?.name || 'Dịch vụ';
  const getStaffName = (a) => a.staff?.name || a.staffId?.name || '';
  const getBranchName = (a) => a.branch?.name || a.branchId?.name || '';
  const getPrice = (a) => a.service?.price || a.serviceId?.price || a.price || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">
          Lịch hẹn của tôi
        </h1>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key ?? 'all'}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.key
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Appointment List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Không có lịch hẹn nào.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => {
              const statusInfo = STATUS_MAP[appt.status] || STATUS_MAP.pending;
              const canCancel = ['awaiting_deposit', 'pending', 'confirmed'].includes(appt.status);
              const canPayDeposit = appt.status === 'awaiting_deposit' && appt.depositStatus === 'pending';
              const canReview = appt.status === 'completed' && !appt.reviewed;

              return (
                <div
                  key={appt.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-lg">{getServiceName(appt)}</h3>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FiCalendar className="text-xs" />
                          {appt.date ? new Date(appt.date).toLocaleDateString('vi-VN') : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="text-xs" />
                          {appt.time}
                        </span>
                        {getStaffName(appt) && (
                          <span className="flex items-center gap-1">
                            <FiUser className="text-xs" />
                            {getStaffName(appt)}
                          </span>
                        )}
                        {getBranchName(appt) && (
                          <span className="flex items-center gap-1">
                            <FiMapPin className="text-xs" />
                            {getBranchName(appt)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[var(--primary)] font-bold text-lg">
                        {formatPrice(getPrice(appt))}
                      </span>
                      {canPayDeposit && (
                        <button
                          onClick={() => setDepositPayAppt(appt)}
                          className="px-4 py-2 text-sm font-bold text-white bg-[#8B5E3C] rounded-lg hover:bg-[#6D492E] transition-colors flex items-center gap-1.5 shadow-md"
                        >
                          <FiDollarSign className="text-sm" />
                          Đặt cọc
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(appt.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Hủy lịch
                        </button>
                      )}
                      {canReview && (
                        <button
                          onClick={() => setReviewModal(appt)}
                          className="px-4 py-2 text-sm font-medium text-[var(--primary)] border border-[var(--accent)] rounded-lg hover:bg-[var(--bg-light)] transition-colors"
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={!!reviewModal}
        title="Đánh giá dịch vụ"
        subtitle={reviewModal ? getServiceName(reviewModal) : ''}
        onClose={() => setReviewModal(null)}
        onSubmit={handleReviewSubmit}
        submitting={submittingReview}
      />

      {/* Bank Transfer Modal for deposit */}
      <BankTransferModal
        isOpen={!!depositPayAppt}
        onClose={() => { setDepositPayAppt(null); fetchAppointments(); }}
        amount={depositPayAppt?.depositAmount || depositPayAppt?.totalPrice || 0}
        apptId={depositPayAppt?.id}
      />
    </div>
  );
}

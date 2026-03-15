import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiCheck, FiChevronLeft, FiChevronRight, FiImage,
  FiClock, FiMapPin, FiUser, FiCalendar, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { serviceService } from '../../services/serviceService';
import { branchService } from '../../services/branchService';
import { staffService } from '../../services/staffService';
import { appointmentService } from '../../services/appointmentService';

import { formatPrice } from '../../utils/formatPrice';

const STEPS = [
  { label: 'Chọn dịch vụ', icon: FiFileText },
  { label: 'Chọn chi nhánh', icon: FiMapPin },
  { label: 'Chọn thợ', icon: FiUser },
  { label: 'Chọn ngày & giờ', icon: FiCalendar },
  { label: 'Xác nhận', icon: FiCheck },
];

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDayLabel(date) {
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return { dayName: dayNames[date.getDay()], dayMonth: `${day}/${month}` };
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId');

  const [currentStep, setCurrentStep] = useState(preselectedServiceId ? 1 : 0);
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Selections
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [note, setNote] = useState('');

  const next7Days = getNext7Days();

  // Load services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await serviceService.getAll();
        const data = res.data || res;
        setServices(data);
        if (preselectedServiceId) {
          const found = data.find((s) => s.id === Number(preselectedServiceId));
          if (found) setSelectedService(found);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, [preselectedServiceId]);

  // Load branches when step 1
  useEffect(() => {
    if (currentStep === 1) {
      setLoading(true);
      branchService.getAll()
        .then((res) => setBranches(res.data || res))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentStep]);

  // Load staff when step 2
  useEffect(() => {
    if (currentStep === 2 && selectedBranch) {
      setLoading(true);
      staffService.getAll()
        .then((res) => {
          const all = res.data || res;
          const filtered = all.filter(
            (s) => s.branchId === selectedBranch.id || s.branch === selectedBranch.id || s.branch?.id === selectedBranch.id
          );
          setStaffList(filtered.length > 0 ? filtered : all);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentStep, selectedBranch]);

  // Load available slots when step 3 and date selected
  useEffect(() => {
    if (currentStep === 3 && selectedDate && selectedBranch && selectedService) {
      setLoading(true);
      appointmentService.getAvailableSlots({
        branchId: selectedBranch.id,
        staffId: selectedStaff?.id,
        serviceId: selectedService.id,
        date: formatDate(selectedDate),
      })
        .then((res) => setAvailableSlots(res.data || res || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [currentStep, selectedDate, selectedBranch, selectedStaff, selectedService]);

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return !!selectedService;
      case 1: return !!selectedBranch;
      case 2: return !!selectedStaff;
      case 3: return !!selectedDate && !!selectedTime;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < 4) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await appointmentService.create({
        serviceId: selectedService.id,
        branchId: selectedBranch.id,
        staffId: selectedStaff.id,
        date: formatDate(selectedDate),
        startTime: selectedTime,
        note,
      });
      toast.success('Đặt lịch thành công!');
      navigate('/my-appointments');
    } catch (err) {
      toast.error(err.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step indicator
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? <FiCheck /> : <Icon />}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  isActive ? 'text-[var(--primary)] font-semibold' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-1 ${
                  idx < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  // Step 0: Choose Service
  const renderStepService = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn dịch vụ</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div
            key={s.id}
            onClick={() => setSelectedService(s)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedService?.id === s.id
                ? 'border-[var(--primary)] bg-[var(--bg-light)]'
                : 'border-gray-200 bg-white hover:border-[var(--accent)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {s.image ? (
                <img src={s.image} alt={s.name} className="w-14 h-14 rounded-lg object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center">
                  <FiImage className="text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 line-clamp-1">{s.name}</h3>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="text-[var(--primary)] font-bold">{formatPrice(s.price)}</span>
                  <span className="text-gray-400 flex items-center gap-1">
                    <FiClock className="text-xs" /> {s.duration} phút
                  </span>
                </div>
              </div>
              {selectedService?.id === s.id && (
                <FiCheck className="text-[var(--primary)] text-xl flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 1: Choose Branch
  const renderStepBranch = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn chi nhánh</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              onClick={() => setSelectedBranch(b)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedBranch?.id === b.id
                  ? 'border-[var(--primary)] bg-[var(--bg-light)]'
                  : 'border-gray-200 bg-white hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">{b.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                    <FiMapPin className="text-xs flex-shrink-0" /> {b.address}
                  </p>
                  {b.openHours && (
                    <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                      <FiClock className="text-xs flex-shrink-0" /> {b.openHours}
                    </p>
                  )}
                  {b.phone && (
                    <p className="text-gray-400 text-sm mt-1">{b.phone}</p>
                  )}
                </div>
                {selectedBranch?.id === b.id && (
                  <FiCheck className="text-[var(--primary)] text-xl flex-shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 2: Choose Staff
  const renderStepStaff = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn thợ</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : staffList.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Không có thợ nào tại chi nhánh này.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedStaff(s)}
              className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                selectedStaff?.id === s.id
                  ? 'border-[var(--primary)] bg-[var(--bg-light)]'
                  : 'border-gray-200 bg-white hover:border-[var(--accent)]'
              }`}
            >
              <div className="flex items-center gap-3">
                {s.avatar || s.image ? (
                  <img
                    src={s.avatar || s.image}
                    alt={s.fullName || s.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg">
                    {(s.fullName || s.name || '')?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800">{s.fullName || s.name}</h3>
                  {s.skills && s.skills.length > 0 && (
                    <p className="text-gray-400 text-xs mt-1 line-clamp-1">
                      {s.skills.map((sk) => sk.service?.name || sk.name || (typeof sk === 'string' ? sk : '')).filter(Boolean).join(', ')}
                    </p>
                  )}
                  {s.rating != null && (
                    <p className="text-yellow-500 text-sm mt-1">
                      {'*'.repeat(Math.round(s.rating))} {s.rating.toFixed(1)}
                    </p>
                  )}
                </div>
                {selectedStaff?.id === s.id && (
                  <FiCheck className="text-[var(--primary)] text-xl flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Step 3: Choose Date & Time
  const renderStepDateTime = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn ngày & giờ</h2>

      {/* Date chips */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-3">Chọn ngày:</p>
        <div className="flex flex-wrap gap-2">
          {next7Days.map((d) => {
            const { dayName, dayMonth } = formatDayLabel(d);
            const isSelected = selectedDate && formatDate(d) === formatDate(selectedDate);
            return (
              <button
                key={formatDate(d)}
                onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                className={`flex flex-col items-center px-4 py-2 rounded-xl border-2 transition-all min-w-[72px] ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-[var(--accent)]'
                }`}
              >
                <span className="text-xs font-medium">{dayName}</span>
                <span className="text-sm font-bold">{dayMonth}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <p className="text-sm text-gray-500 mb-3">Chọn giờ:</p>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-gray-400 text-center py-6">Không có khung giờ nào khả dụng cho ngày này.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSlots.map((slot) => {
                const time = slot.startTime || slot.time || (typeof slot === 'string' ? slot : '');
                const label = slot.endTime ? `${time} - ${slot.endTime}` : time;
                const isAvailable = slot.available !== false;
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => isAvailable && setSelectedTime(time)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[var(--primary)] text-white border-2 border-[var(--primary)]'
                        : isAvailable
                        ? 'bg-green-50 text-green-700 border-2 border-green-200 hover:border-green-400'
                        : 'bg-gray-100 text-gray-300 border-2 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Step 4: Confirmation
  const renderStepConfirm = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Xác nhận đặt lịch</h2>
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 max-w-lg">
        <div className="flex justify-between">
          <span className="text-gray-500">Dịch vụ</span>
          <span className="font-semibold text-gray-800">{selectedService?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Chi nhánh</span>
          <span className="font-semibold text-gray-800">{selectedBranch?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Thợ</span>
          <span className="font-semibold text-gray-800">{selectedStaff?.fullName || selectedStaff?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ngày</span>
          <span className="font-semibold text-gray-800">
            {selectedDate ? formatDayLabel(selectedDate).dayMonth : ''}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Giờ</span>
          <span className="font-semibold text-gray-800">{selectedTime}</span>
        </div>
        <hr className="border-gray-100" />
        <div className="flex justify-between">
          <span className="text-gray-500">Giá</span>
          <span className="font-bold text-[var(--primary)] text-lg">
            {formatPrice(selectedService?.price)}
          </span>
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 max-w-lg">
        <label className="block text-sm text-gray-500 mb-2">Ghi chú (tùy chọn)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
          placeholder="Nhập ghi chú cho thợ..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-6 w-full max-w-lg py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-light)] transition-colors text-lg disabled:opacity-50"
      >
        {submitting ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
      </button>
    </div>
  );

  const stepContent = [renderStepService, renderStepBranch, renderStepStaff, renderStepDateTime, renderStepConfirm];

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-2">Đặt lịch hẹn</h1>
        <p className="text-gray-500 mb-8">Bước {currentStep + 1} / {STEPS.length}</p>

        {renderStepIndicator()}
        {stepContent[currentStep]()}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-10">
            <button
              onClick={handleBack}
              disabled={currentStep === 0 || (currentStep === 1 && preselectedServiceId)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <FiChevronLeft />
              Quay lại
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold hover:bg-[var(--primary-light)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp theo
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

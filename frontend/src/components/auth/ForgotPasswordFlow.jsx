import { useState, useEffect } from 'react';
import { FiMail, FiLock, FiX, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordFlow({ isOpen, onClose, initialEmail = '' }) {
  const [step, setStep] = useState(initialEmail ? 2 : 1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Cập nhật step và email nếu initialEmail thay đổi
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep(initialEmail ? 2 : 1);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setCountdown(0);
      
      // Tự động gửi OTP nếu có initialEmail (ví dụ: từ trang Profile)
      if (initialEmail) {
        handleSendOtp(initialEmail);
      }
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (targetEmail) => {
    const emailToSend = targetEmail || email;
    if (!emailToSend) return toast.error('Vui lòng nhập email');
    
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: emailToSend });
      if (res.success) {
        toast.success(res.message);
        setStep(2);
        setCountdown(60);
      } else {
        toast.error(res.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async () => {
    if (step === 2) {
      if (!otp || otp.length !== 6) return toast.error('Vui lòng nhập đủ 6 số OTP');
      // Ở luồng này, ta có thể cho phép người dùng chuyển qua bước 3 luôn, 
      // rồi gửi chung email + otp + newPassword lên server 1 lượt.
      // Nhưng để chắc chắn, ta kiểm tra frontend xem đã đủ chưa, 
      // vì server hiện tại chỉ có 1 hàm resetPassword gộp.
      setStep(3);
    } else if (step === 3) {
      if (newPassword.length < 6) return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');

      setLoading(true);
      try {
        const res = await api.post('/auth/reset-password', {
          email,
          otp,
          newPassword
        });
        if (res.success) {
          toast.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
          onClose(); // Đóng modal
        } else {
          toast.error(res.message || 'Có lỗi xảy ra');
          // Nếu OTP sai, quay lại bước 2
          if (res.message.includes('Mã xác thực')) setStep(2);
        }
      } catch (err) {
        toast.error(err.message || 'Lỗi kết nối máy chủ');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            {step === 1 ? 'Quên mật khẩu' : step === 2 ? 'Xác thực OTP' : 'Tạo mật khẩu mới'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer border-0 bg-transparent text-gray-500">
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-6">
                Vui lòng nhập email bạn đã đăng ký để nhận mã OTP lấy lại mật khẩu.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <button
                onClick={() => handleSendOtp(email)}
                disabled={loading || !email}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl hover:bg-primary-dark transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
                <FiArrowRight />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-6">
                Chúng tôi đã gửi mã OTP gồm 6 chữ số đến email <br/><span className="font-semibold text-primary">{email}</span>
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Nhập mã OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[1em] text-2xl font-bold py-3 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <button
                onClick={handleVerifyOtpAndReset}
                disabled={loading || otp.length !== 6}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
              >
                Xác nhận
              </button>
              
              <div className="text-center mt-4">
                <button 
                  onClick={() => handleSendOtp(email)}
                  disabled={countdown > 0 || loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline border-0 bg-transparent cursor-pointer"
                >
                  {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center mb-6">
                Vui lòng tạo mật khẩu mới an toàn và dễ nhớ.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
              <button
                onClick={handleVerifyOtpAndReset}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl hover:bg-primary-dark transition-colors flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                <FiCheckCircle />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

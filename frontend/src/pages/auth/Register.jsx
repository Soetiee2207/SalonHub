import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

export default function Register() {
  const { user, register, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' || user.role === 'staff' ? '/admin' : '/', { replace: true });
    }
  }, [user, navigate]);

  // Step 1: Form, Step 2: OTP
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const otpInputs = useRef([]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.fullName.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('Vui lòng nhập email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('Email không hợp lệ');
      return false;
    }
    if (!form.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return false;
    }
    if (!form.password) {
      toast.error('Vui lòng nhập mật khẩu');
      return false;
    }
    if (form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...data } = form;
      await register(data);
      toast.success('Mã xác thực đã được gửi đến email của bạn');
      setStep(2);
      setTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next
    if (value && index < 5) {
      otpInputs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      toast.error('Vui lòng nhập đầy đủ mã xác thực 6 số');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({
        email: form.email,
        otp: otpValue,
        registrationData: form
      });
      toast.success('Xác thực thành công! Chào mừng bạn.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã xác thực không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await authService.resendOtp({ email: form.email });
      setTimer(60);
      toast.success('Mã xác thực mới đã được gửi');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi lại mã');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = ({ label, name, type = 'text', icon: Icon, placeholder, isPassword, showState, toggleShow }) => (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
          <Icon size={18} />
        </span>
        <input
          type={isPassword ? (showState ? 'text' : 'password') : type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-11 ${isPassword ? 'pr-11' : 'pr-4'} py-3 rounded-xl border text-sm outline-none`}
          style={{
            borderColor: 'var(--border)',
            fontFamily: 'var(--font-body)',
            transition: 'border-color 0.3s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
        {isPassword && (
          <button
            type="button"
            onClick={toggleShow}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
            style={{ color: 'var(--text-gray)' }}
          >
            {showState ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-light)' }}>
      {/* Left - Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"
          alt="Salon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: 'rgba(30, 20, 12, 0.55)' }} />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <h2
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tham gia SalonHub
          </h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}>
            Không gian tóc đẳng cấp
          </p>
        </div>
      </div>

      {/* Right - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-10">
            <h2
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)' }}
            >
              SalonHub
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-gray)' }}>
              Không gian tóc đẳng cấp
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 sm:p-10 border shadow-sm" style={{ borderColor: 'var(--border)' }}>
            
            {step === 1 ? (
              <>
                <div className="mb-8">
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark, #5A3A24)' }}
                  >
                    Tạo tài khoản
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}>
                    Đăng ký để trải nghiệm dịch vụ đẳng cấp
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {renderInput({
                    label: 'Họ và tên',
                    name: 'fullName',
                    icon: FiUser,
                    placeholder: 'Nguyễn Văn A',
                  })}

                  {renderInput({
                    label: 'Email',
                    name: 'email',
                    type: 'email',
                    icon: FiMail,
                    placeholder: 'email@example.com',
                  })}

                  {renderInput({
                    label: 'Số điện thoại',
                    name: 'phone',
                    type: 'tel',
                    icon: FiPhone,
                    placeholder: '0912 345 678',
                  })}

                  {renderInput({
                    label: 'Mật khẩu',
                    name: 'password',
                    icon: FiLock,
                    placeholder: 'Ít nhất 6 ký tự',
                    isPassword: true,
                    showState: showPassword,
                    toggleShow: () => setShowPassword(!showPassword),
                  })}

                  {renderInput({
                    label: 'Xác nhận mật khẩu',
                    name: 'confirmPassword',
                    icon: FiLock,
                    placeholder: 'Nhập lại mật khẩu',
                    isPassword: true,
                    showState: showConfirm,
                    toggleShow: () => setShowConfirm(!showConfirm),
                  })}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer mt-2"
                    style={{
                      backgroundColor: 'var(--primary)',
                      fontFamily: 'var(--font-body)',
                      transition: 'opacity 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng ký'}
                  </button>
                </form>
              </>
            ) : (
              // STEP 2: OTP VERIFICATION
              <div className="animate-in fade-in duration-500">
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm mb-6 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-gray)' }}
                >
                  <FiArrowLeft /> Quay lại sửa thông tin
                </button>

                <div className="mb-8">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(90, 58, 36, 0.1)', color: 'var(--primary)' }}>
                    <FiMail size={32} />
                  </div>
                  <h1
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark, #5A3A24)' }}
                  >
                    Xác thực Email
                  </h1>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}>
                    Chúng tôi đã gửi mã OTP 6 số đến <span className="font-bold text-slate-700">{form.email}</span>. Vui lòng nhập mã để hoàn tất.
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpInputs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold rounded-xl border outline-none transition-all"
                        style={{
                          borderColor: otp[index] ? 'var(--primary)' : 'var(--border)',
                          backgroundColor: otp[index] ? 'rgba(90, 58, 36, 0.05)' : 'white'
                        }}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length < 6}
                    className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--primary)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực ngay'}
                  </button>

                  <div className="text-center">
                    <p className="text-sm" style={{ color: 'var(--text-gray)' }}>
                      Không nhận được mã?{' '}
                      {timer > 0 ? (
                        <span className="font-medium">Gửi lại sau {timer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="font-bold hover:underline"
                          style={{ color: 'var(--primary)' }}
                        >
                          Gửi lại mã
                        </button>
                      )}
                    </p>
                  </div>
                </form>
              </div>
            )}

            <p
              className="text-center text-sm mt-8"
              style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}
            >
              {step === 1 ? (
                <>
                  Đã có tài khoản?{' '}
                  <Link
                    to="/login"
                    className="font-semibold hover:underline"
                    style={{ color: 'var(--primary)' }}
                  >
                    Đăng nhập
                  </Link>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

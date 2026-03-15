import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' || user.role === 'staff' ? '/admin' : '/', { replace: true });
    }
  }, [user, navigate]);

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
      toast.success('Đăng ký thành công!');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
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

      {/* Right - Register Form */}
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

          <div className="bg-white rounded-2xl p-8 sm:p-10 border" style={{ borderColor: 'var(--border)' }}>
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

            <p
              className="text-center text-sm mt-8"
              style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}
            >
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

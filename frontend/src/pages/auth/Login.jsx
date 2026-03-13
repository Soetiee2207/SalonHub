import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' || user.role === 'staff' ? '/admin' : '/', { replace: true });
    }
  }, [user, navigate]);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      await login(form);
      toast.success('Đăng nhập thành công!');
    } catch (err) {
      toast.error(err.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

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
            SalonHub
          </h2>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}>
            Không gian tóc đẳng cấp
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
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
                Chào mừng trở lại
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}>
                Đăng nhập để tiếp tục
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
                >
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                    <FiMail size={18} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm outline-none"
                    style={{
                      borderColor: 'var(--border)',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                    <FiLock size={18} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-11 pr-11 py-3 rounded-xl border text-sm outline-none"
                    style={{
                      borderColor: 'var(--border)',
                      fontFamily: 'var(--font-body)',
                      transition: 'border-color 0.3s ease',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                    style={{ color: 'var(--text-gray)' }}
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  fontFamily: 'var(--font-body)',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!loading) e.target.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <p
              className="text-center text-sm mt-8"
              style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}
            >
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-semibold hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

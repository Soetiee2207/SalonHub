import { useState, useRef } from 'react';
import { FiUser, FiPhone, FiMail, FiCamera, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

const roleBadgeMap = {
  admin: { label: 'Quản trị viên', bg: '#8B5E3C', color: '#fff' },
  staff: { label: 'Nhân viên', bg: '#C4956A', color: '#fff' },
  customer: { label: 'Khách hàng', bg: '#F5EDE4', color: '#8B5E3C' },
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [saving, setSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập họ và tên');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('phone', form.phone.trim());
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await authService.updateProfile(formData);
      const updatedUser = res.data || res;
      updateUser(updatedUser);
      toast.success('Cập nhật thông tin thành công!');
      setAvatarFile(null);
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!passwordForm.newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const badge = roleBadgeMap[user?.role] || roleBadgeMap.customer;

  const renderPasswordField = (label, name, placeholder, showState, toggleShow) => (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
      >
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
          <FiLock size={18} />
        </span>
        <input
          type={showState ? 'text' : 'password'}
          name={name}
          value={passwordForm[name]}
          onChange={handlePasswordChange}
          placeholder={placeholder}
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
          onClick={toggleShow}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
          style={{ color: 'var(--text-gray)' }}
        >
          {showState ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-light)' }}>
      {/* Top Banner */}
      <div className="py-12 px-4" style={{ backgroundColor: 'var(--bg-warm, #F5EDE4)' }}>
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-4 flex items-center justify-center cursor-pointer"
              style={{ borderColor: 'var(--primary-light, #C4956A)', backgroundColor: '#F3E8DE' }}
              onClick={handleAvatarClick}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiUser size={42} style={{ color: 'var(--primary-light, #C4956A)' }} />
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
              style={{ backgroundColor: 'var(--primary)', color: 'white' }}
            >
              <FiCamera size={15} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark, #5A3A24)' }}
          >
            {user?.name || 'Người dùng'}
          </h1>
          <p className="text-sm mb-3" style={{ color: 'var(--text-gray)', fontFamily: 'var(--font-body)' }}>
            {user?.email}
          </p>
          <span
            className="inline-block px-4 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: badge.bg,
              color: badge.color,
              fontFamily: 'var(--font-body)',
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Personal Info */}
          <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--border)' }}>
            <h2
              className="text-lg font-bold mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark, #5A3A24)' }}
            >
              Thông tin cá nhân
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {/* Email (read-only) */}
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
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm bg-gray-50 cursor-not-allowed"
                    style={{
                      borderColor: 'var(--border)',
                      color: 'var(--text-gray)',
                      fontFamily: 'var(--font-body)',
                    }}
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
                >
                  Họ và tên
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                    <FiUser size={18} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
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

              {/* Phone */}
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: 'var(--text-dark)', fontFamily: 'var(--font-body)' }}
                >
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                    <FiPhone size={18} />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0912 345 678"
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

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  fontFamily: 'var(--font-body)',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!saving) e.target.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
              >
                {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
              </button>
            </form>
          </div>

          {/* Right - Change Password */}
          <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: 'var(--border)' }}>
            <h2
              className="text-lg font-bold mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--primary-dark, #5A3A24)' }}
            >
              Đổi mật khẩu
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {renderPasswordField(
                'Mật khẩu hiện tại',
                'currentPassword',
                'Nhập mật khẩu hiện tại',
                showCurrent,
                () => setShowCurrent(!showCurrent)
              )}

              {renderPasswordField(
                'Mật khẩu mới',
                'newPassword',
                'Ít nhất 6 ký tự',
                showNew,
                () => setShowNew(!showNew)
              )}

              {renderPasswordField(
                'Xác nhận mật khẩu mới',
                'confirmPassword',
                'Nhập lại mật khẩu mới',
                showConfirm,
                () => setShowConfirm(!showConfirm)
              )}

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 cursor-pointer"
                style={{
                  backgroundColor: 'var(--primary)',
                  fontFamily: 'var(--font-body)',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => { if (!changingPassword) e.target.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
              >
                {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

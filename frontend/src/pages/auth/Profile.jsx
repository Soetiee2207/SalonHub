import { useState, useRef } from 'react';
import { FiUser, FiPhone, FiMail, FiCamera, FiLock, FiEye, FiEyeOff, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

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

  const [showPasswordSection, setShowPasswordSection] = useState(false);
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
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const inputClass = 'w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)]';
  const passwordInputClass = 'w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-[var(--primary)]';

  return (
    <div className="min-h-[80vh] px-4 py-12" style={{ backgroundColor: 'var(--bg-light)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Profile Info Card */}
        <div className="bg-white rounded-xl p-8 border" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--primary-dark)' }}>
            Thông tin cá nhân
          </h1>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center cursor-pointer"
                  style={{ borderColor: 'var(--primary-light)', backgroundColor: '#F3E8DE' }}
                  onClick={handleAvatarClick}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser size={36} style={{ color: 'var(--primary-light)' }} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white cursor-pointer"
                  style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                >
                  <FiCamera size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                  <FiMail size={18} />
                </span>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-gray-50 cursor-not-allowed"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-gray)' }}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                Họ và tên
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                  <FiUser size={18} />
                </span>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className={inputClass}
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                  <FiPhone size={18} />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                  className={inputClass}
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {saving ? 'Đang lưu...' : 'Cập nhật thông tin'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="w-full px-8 py-4 flex items-center justify-between cursor-pointer"
            style={{ color: 'var(--text-dark)' }}
          >
            <div className="flex items-center gap-3">
              <FiLock size={20} style={{ color: 'var(--primary)' }} />
              <span className="font-semibold text-base">Đổi mật khẩu</span>
            </div>
            {showPasswordSection ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSubmit} className="px-8 pb-8 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="pt-5 space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                      <FiLock size={18} />
                    </span>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu hiện tại"
                      className={passwordInputClass}
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: 'var(--text-gray)' }}
                    >
                      {showCurrent ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                      <FiLock size={18} />
                    </span>
                    <input
                      type={showNew ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Ít nhất 6 ký tự"
                      className={passwordInputClass}
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: 'var(--text-gray)' }}
                    >
                      {showNew ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-dark)' }}>
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-gray)' }}>
                      <FiLock size={18} />
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập lại mật khẩu mới"
                      className={passwordInputClass}
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: 'var(--text-gray)' }}
                    >
                      {showConfirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-60 cursor-pointer"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {changingPassword ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

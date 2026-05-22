import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { authService } from '../../../services/authService';
import { toast } from 'react-hot-toast';
import {
  FiUser, FiPhone, FiLock, FiCamera,
  FiCalendar, FiStar, FiClock, FiMapPin
} from 'react-icons/fi';
import LoadingSpinner from '../../common/LoadingSpinner';

export default function StaffProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getProfile();
      const data = res.data?.data || res.data || res;
      setProfileData(data);
      setFormData({
        fullName: data.fullName || '',
        phone: data.phone || '',
      });
      // Cập nhật lại user trong context để Header ăn theo (ví dụ: avatar mới, tên mới)
      updateUser(data);
    } catch (err) {
      toast.error('Không thể tải thông tin hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const handleInfoChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      toast.loading('Đang cập nhật ảnh đại diện...', { id: 'avatarUpload' });
      await authService.updateProfile(formDataUpload);
      toast.success('Đã cập nhật ảnh đại diện.', { id: 'avatarUpload' });
      fetchProfile(); // Tải lại toàn bộ hồ sơ
    } catch (err) {
      toast.error('Cập nhật ảnh thất bại.', { id: 'avatarUpload' });
    }
  };

  const submitInfoUpdate = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingInfo(true);
      const updatePayload = new FormData();
      updatePayload.append('fullName', formData.fullName);
      updatePayload.append('phone', formData.phone);
      
      await authService.updateProfile(updatePayload);
      toast.success('Đã cập nhật thông tin thành công!');
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin.');
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const submitPasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp.');
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
    }

    try {
      setIsUpdatingPassword(true);
      await authService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const roleLabel = 
    profileData?.role === 'admin' ? 'Quản trị viên' :
    profileData?.role === 'warehouse_staff' ? 'Nhân viên kho' :
    profileData?.role === 'accountant' ? 'Kế toán' : 'Nhân viên dịch vụ';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý thông tin, kỹ năng và lịch làm việc của bạn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cột trái: Avatar & Thông tin cơ bản */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg mx-auto flex items-center justify-center">
                {profileData?.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="text-slate-300 w-16 h-16" />
                )}
              </div>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-2 right-2 w-8 h-8 bg-white text-[var(--primary)] rounded-full shadow-md border border-slate-100 flex items-center justify-center hover:bg-slate-50 hover:scale-110 transition-all cursor-pointer"
                title="Đổi ảnh đại diện"
              >
                <FiCamera size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <h2 className="text-lg font-bold text-slate-800">{profileData?.fullName || 'Chưa cập nhật'}</h2>
            <p className="text-sm text-[var(--primary)] font-semibold mt-1">{roleLabel}</p>

            {profileData?.branch && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg w-max mx-auto border border-slate-100">
                <FiMapPin className="text-emerald-500" />
                {profileData.branch.name}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
              <FiStar className="text-[var(--primary)]" />
              Kỹ năng chuyên môn
            </h3>
            {profileData?.skilledServices && profileData.skilledServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileData.skilledServices.map((srv) => (
                  <span key={srv.id} className="px-3 py-1.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold rounded-lg border border-[var(--primary)]/20">
                    {srv.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                Không có kỹ năng dịch vụ nào.
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Form cập nhật & Lịch làm việc */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider flex items-center gap-2">
              <FiUser className="text-[var(--primary)]" />
              Cập nhật thông tin
            </h3>
            <form onSubmit={submitInfoUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInfoChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                      placeholder="Nhập họ và tên..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInfoChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                      placeholder="Nhập số điện thoại..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingInfo}
                  className="px-5 py-2.5 bg-[var(--primary)] text-white text-sm font-bold rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-0 cursor-pointer"
                >
                  {isUpdatingInfo ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider flex items-center gap-2">
              <FiLock className="text-[var(--primary)]" />
              Đổi mật khẩu
            </h3>
            <form onSubmit={submitPasswordUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                    placeholder="Nhập mật khẩu cũ..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                    placeholder="Mật khẩu mới..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-all"
                    placeholder="Nhập lại mật khẩu..."
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="px-5 py-2.5 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed border-0 cursor-pointer"
                >
                  {isUpdatingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider flex items-center gap-2">
              <FiCalendar className="text-[var(--primary)]" />
              Lịch làm việc sắp tới
            </h3>
            {profileData?.schedules && profileData.schedules.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-100">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Ngày</th>
                      <th className="px-4 py-3">Ca làm việc</th>
                      <th className="px-4 py-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {profileData.schedules.map((schedule) => (
                      <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {new Date(schedule.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <FiClock size={14} className="text-slate-400" />
                            {schedule.shiftType === 'morning' ? 'Ca Sáng (08:00 - 12:00)' : 
                             schedule.shiftType === 'afternoon' ? 'Ca Chiều (13:00 - 17:00)' : 
                             schedule.shiftType === 'evening' ? 'Ca Tối (17:30 - 21:30)' : 'Cả ngày'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                            schedule.status === 'working' ? 'bg-emerald-50 text-emerald-600' :
                            schedule.status === 'off' ? 'bg-red-50 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {schedule.status === 'working' ? 'Đi làm' : 
                             schedule.status === 'off' ? 'Nghỉ' : 'Không xác định'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <FiCalendar className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-medium">Chưa có lịch làm việc nào được phân công.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

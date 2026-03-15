import { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiMapPin, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { addressService } from '../../services/addressService';

export default function AddressForm({ address, onClose, onSaved }) {
  const isEdit = !!address;

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: '',
    wardCode: '',
    wardName: '',
    street: '',
    isDefault: false,
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    addressService.getProvinces()
      .then(setProvinces)
      .catch(() => toast.error('Không thể tải danh sách tỉnh/thành'))
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    if (address) {
      setForm({
        fullName: address.fullName || '',
        phone: address.phone || '',
        provinceCode: address.provinceCode || '',
        provinceName: address.provinceName || '',
        districtCode: address.districtCode || '',
        districtName: address.districtName || '',
        wardCode: address.wardCode || '',
        wardName: address.wardName || '',
        street: address.street || '',
        isDefault: address.isDefault || false,
      });

      if (address.provinceCode) {
        setLoadingDistricts(true);
        addressService.getDistricts(address.provinceCode)
          .then(setDistricts)
          .finally(() => setLoadingDistricts(false));
      }
      if (address.districtCode) {
        setLoadingWards(true);
        addressService.getWards(address.districtCode)
          .then(setWards)
          .finally(() => setLoadingWards(false));
      }
    }
  }, [address]);

  const handleProvinceChange = async (e) => {
    const code = e.target.value;
    const selected = provinces.find(p => String(p.code) === code);
    setForm(prev => ({
      ...prev,
      provinceCode: code,
      provinceName: selected?.name || '',
      districtCode: '',
      districtName: '',
      wardCode: '',
      wardName: '',
    }));
    setDistricts([]);
    setWards([]);

    if (code) {
      setLoadingDistricts(true);
      try {
        const data = await addressService.getDistricts(code);
        setDistricts(data);
      } catch {
        toast.error('Không thể tải danh sách quận/huyện');
      } finally {
        setLoadingDistricts(false);
      }
    }
  };

  const handleDistrictChange = async (e) => {
    const code = e.target.value;
    const selected = districts.find(d => String(d.code) === code);
    setForm(prev => ({
      ...prev,
      districtCode: code,
      districtName: selected?.name || '',
      wardCode: '',
      wardName: '',
    }));
    setWards([]);

    if (code) {
      setLoadingWards(true);
      try {
        const data = await addressService.getWards(code);
        setWards(data);
      } catch {
        toast.error('Không thể tải danh sách phường/xã');
      } finally {
        setLoadingWards(false);
      }
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const selected = wards.find(w => String(w.code) === code);
    setForm(prev => ({
      ...prev,
      wardCode: code,
      wardName: selected?.name || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.provinceCode || !form.districtCode || !form.wardCode || !form.street.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await addressService.update(address.id, form);
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        await addressService.create(form);
        toast.success('Thêm địa chỉ thành công');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent bg-white appearance-none';
  const inputClass = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-transparent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">
            {isEdit ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <FiUser size={14} /> Tên người nhận
              </label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nhập tên người nhận"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                <FiPhone size={14} /> Số điện thoại
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Nhập số điện thoại"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <FiMapPin size={14} /> Tỉnh / Thành phố
            </label>
            <select
              value={form.provinceCode}
              onChange={handleProvinceChange}
              className={selectClass}
              required
              disabled={loadingProvinces}
            >
              <option value="">{loadingProvinces ? 'Đang tải...' : 'Chọn Tỉnh / Thành phố'}</option>
              {provinces.map(p => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Quận / Huyện</label>
              <select
                value={form.districtCode}
                onChange={handleDistrictChange}
                className={selectClass}
                required
                disabled={!form.provinceCode || loadingDistricts}
              >
                <option value="">{loadingDistricts ? 'Đang tải...' : 'Chọn Quận / Huyện'}</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phường / Xã</label>
              <select
                value={form.wardCode}
                onChange={handleWardChange}
                className={selectClass}
                required
                disabled={!form.districtCode || loadingWards}
              >
                <option value="">{loadingWards ? 'Đang tải...' : 'Chọn Phường / Xã'}</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
              <FiHome size={14} /> Số nhà, tên đường
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm(prev => ({ ...prev, street: e.target.value }))}
              placeholder="VD: 123 Nguyễn Văn A"
              className={inputClass}
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm(prev => ({ ...prev, isDefault: e.target.checked }))}
              className="accent-[var(--primary)] w-4 h-4"
            />
            <span className="text-sm text-gray-700">Đặt làm địa chỉ mặc định</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm địa chỉ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

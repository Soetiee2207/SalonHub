import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { voucherService } from '../../services/voucherService';
import { formatPrice } from '../../utils/formatPrice';

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: '', discount: '', discountType: 'percent', minOrderValue: '',
    maxDiscount: '', startDate: '', endDate: '', usageLimit: '', isActive: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await voucherService.getAll();
      setVouchers(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ code: '', discount: '', discountType: 'percent', minOrderValue: '', maxDiscount: '', startDate: '', endDate: '', usageLimit: '', isActive: true });
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      code: v.code, discount: v.discount, discountType: v.discountType || 'percent',
      minOrderValue: v.minOrderValue || '', maxDiscount: v.maxDiscount || '',
      startDate: v.startDate ? v.startDate.substring(0, 10) : '',
      endDate: v.endDate ? v.endDate.substring(0, 10) : '',
      usageLimit: v.usageLimit || '', isActive: v.isActive !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = {
        code: form.code, discount: Number(form.discount), discountType: form.discountType,
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        startDate: form.startDate, endDate: form.endDate,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0, isActive: form.isActive,
      };

      if (editing) {
        await voucherService.update(editing.id, data);
        toast.success('Cập nhật voucher thành công');
      } else {
        await voucherService.create(data);
        toast.success('Thêm voucher thành công');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await voucherService.delete(deleteId);
      toast.success('Xóa voucher thành công');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa voucher');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '---';

  const getStatus = (v) => {
    if (!v.isActive) return { label: 'Ngừng', cls: 'bg-gray-100 text-gray-600' };
    const now = new Date();
    if (v.endDate && new Date(v.endDate) < now) return { label: 'Hết hạn', cls: 'bg-red-100 text-red-700' };
    if (v.startDate && new Date(v.startDate) > now) return { label: 'Chưa bắt đầu', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Hoạt động', cls: 'bg-green-100 text-green-700' };
  };

  const filtered = vouchers.filter(v =>
    v.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý voucher</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <FiPlus /> Thêm mới
        </button>
      </div>

      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm theo mã voucher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-light)' }}>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Mã</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Giảm giá</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Loại</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Đơn tối thiểu</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Giảm tối đa</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày bắt đầu</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Ngày kết thúc</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Đã dùng/Giới hạn</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(v => {
                const status = getStatus(v);
                return (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: 'var(--primary)' }}>{v.code}</td>
                    <td className="px-4 py-3 text-center font-medium">
                      {v.discountType === 'percent' ? `${v.discount}%` : formatPrice(v.discount)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {v.discountType === 'percent' ? 'Phần trăm' : 'Cố định'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{v.minOrderValue ? formatPrice(v.minOrderValue) : '---'}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{v.maxDiscount ? formatPrice(v.maxDiscount) : '---'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(v.startDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatDate(v.endDate)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{v.usedCount || 0}/{v.usageLimit || '--'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 size={16} /></button>
                        <button onClick={() => setDeleteId(v.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Chỉnh sửa voucher' : 'Thêm voucher mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã voucher *</label>
                <input type="text" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 font-mono" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại giảm giá</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="discountType" value="percent" checked={form.discountType === 'percent'}
                      onChange={e => setForm({ ...form, discountType: e.target.value })} style={{ accentColor: 'var(--primary)' }} />
                    <span className="text-sm">Phần trăm (%)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="discountType" value="fixed" checked={form.discountType === 'fixed'}
                      onChange={e => setForm({ ...form, discountType: e.target.value })} style={{ accentColor: 'var(--primary)' }} />
                    <span className="text-sm">Cố định (VND)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giảm giá {form.discountType === 'percent' ? '(%)' : '(VND)'} *
                </label>
                <input type="number" required min="0" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn tối thiểu (VND)</label>
                  <input type="number" min="0" value={form.minOrderValue} onChange={e => setForm({ ...form, minOrderValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa (VND)</label>
                  <input type="number" min="0" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
                  <input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
                  <input type="date" required value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt sử dụng</label>
                <input type="number" min="0" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Để trống = không giới hạn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">Kích hoạt</label>
                <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? '' : 'bg-gray-300'}`}
                  style={form.isActive ? { backgroundColor: 'var(--primary)' } : {}}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`}
                    style={form.isActive ? { transform: 'translateX(20px)' } : {}} />
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-white disabled:opacity-50" style={{ backgroundColor: 'var(--primary)' }}>
                  {submitting ? 'Đang xử lý...' : editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xóa voucher này?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

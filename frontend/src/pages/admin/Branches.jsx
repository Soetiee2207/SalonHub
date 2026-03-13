import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { branchService } from '../../services/branchService';
import { formatPrice } from '../../utils/formatPrice';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', openTime: '08:00', closeTime: '20:00', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await branchService.getAll();
      setBranches(res.data || res || []);
    } catch {
      toast.error('Lỗi tải dữ liệu chi nhánh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', phone: '', openTime: '08:00', closeTime: '20:00', image: null });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (branch) => {
    setEditing(branch);
    setForm({ name: branch.name, address: branch.address, phone: branch.phone, openTime: branch.openTime || '08:00', closeTime: branch.closeTime || '20:00', image: null });
    setImagePreview(branch.image || null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setForm({ ...form, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('address', form.address);
      formData.append('phone', form.phone);
      formData.append('openTime', form.openTime);
      formData.append('closeTime', form.closeTime);
      if (form.image) formData.append('image', form.image);

      if (editing) {
        await branchService.update(editing.id, formData);
        toast.success('Cập nhật chi nhánh thành công');
      } else {
        await branchService.create(formData);
        toast.success('Thêm chi nhánh thành công');
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
      await branchService.delete(deleteId);
      toast.success('Xóa chi nhánh thành công');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa chi nhánh');
    }
  };

  const filtered = branches.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase()) ||
    b.phone?.includes(search)
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý chi nhánh</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <FiPlus /> Thêm mới
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Tìm kiếm chi nhánh..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ backgroundColor: 'var(--bg-light)' }}>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên chi nhánh</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Địa chỉ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Điện thoại</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Giờ mở cửa</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Giờ đóng cửa</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(branch => (
                <tr key={branch.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{branch.name}</td>
                  <td className="px-4 py-3 text-gray-600">{branch.address}</td>
                  <td className="px-4 py-3 text-gray-600">{branch.phone}</td>
                  <td className="px-4 py-3 text-gray-600">{branch.openTime}</td>
                  <td className="px-4 py-3 text-gray-600">{branch.closeTime}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(branch)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 size={16} /></button>
                      <button onClick={() => setDeleteId(branch.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên chi nhánh *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ *</label>
                <input type="text" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại *</label>
                <input type="text" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                  <input type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đóng cửa</label>
                  <input type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
                <div className="flex items-center gap-4">
                  {imagePreview && <img src={imagePreview} alt="" className="w-20 h-20 object-cover rounded-lg" />}
                  <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <FiImage className="text-gray-400" /> <span className="text-sm text-gray-500">Chọn ảnh</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
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

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xóa chi nhánh này? Hành động này không thể hoàn tác.</p>
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

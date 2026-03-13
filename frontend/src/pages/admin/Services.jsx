import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', categoryId: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);

  // Category management
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '' });
  const [deleteCatId, setDeleteCatId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [svcRes, catRes] = await Promise.all([serviceService.getAll(), serviceService.getCategories()]);
      setServices(svcRes.data || svcRes || []);
      setCategories(catRes.data || catRes || []);
    } catch {
      toast.error('Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', duration: '', categoryId: '', image: null });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditing(svc);
    setForm({
      name: svc.name, description: svc.description || '', price: svc.price,
      duration: svc.duration, categoryId: svc.categoryId?.id || svc.categoryId || '', image: null,
    });
    setImagePreview(svc.image || null);
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
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('duration', form.duration);
      fd.append('categoryId', form.categoryId);
      if (form.image) fd.append('image', form.image);

      if (editing) {
        await serviceService.update(editing.id, fd);
        toast.success('Cập nhật dịch vụ thành công');
      } else {
        await serviceService.create(fd);
        toast.success('Thêm dịch vụ thành công');
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
      await serviceService.delete(deleteId);
      toast.success('Xóa dịch vụ thành công');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa dịch vụ');
    }
  };

  const toggleStatus = async (svc) => {
    try {
      const fd = new FormData();
      fd.append('name', svc.name);
      fd.append('isActive', !svc.isActive);
      await serviceService.update(svc.id, fd);
      toast.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  // Category CRUD
  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        await serviceService.updateCategory(editingCat.id, catForm);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await serviceService.createCategory(catForm);
        toast.success('Thêm danh mục thành công');
      }
      setShowCatModal(false);
      setEditingCat(null);
      setCatForm({ name: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi danh mục');
    }
  };

  const handleDeleteCat = async () => {
    try {
      await serviceService.deleteCategory(deleteCatId);
      toast.success('Xóa danh mục thành công');
      setDeleteCatId(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Lỗi xóa danh mục');
    }
  };

  const getCatName = (svc) => {
    const cat = categories.find(c => (c.id) === (svc.categoryId?.id || svc.categoryId));
    return cat?.name || svc.categoryId?.name || '---';
  };

  const filtered = services.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || (s.categoryId?.id || s.categoryId) === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý dịch vụ</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>
          <FiPlus /> Thêm mới
        </button>
      </div>

      {/* Category management */}
      <div className="mb-4 p-4 bg-white rounded-lg shadow">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-700">Danh mục:</span>
          <button onClick={() => { setEditingCat(null); setCatForm({ name: '' }); setShowCatModal(true); }}
            className="p-1 rounded text-white" style={{ backgroundColor: 'var(--primary)' }}><FiPlus size={14} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilterCat('')}
            className={`px-3 py-1 rounded-full text-sm border ${!filterCat ? 'text-white' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            style={!filterCat ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
            Tất cả
          </button>
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-1">
              <button onClick={() => setFilterCat(cat.id)}
                className={`px-3 py-1 rounded-full text-sm border ${filterCat === (cat.id) ? 'text-white' : 'text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                style={filterCat === (cat.id) ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                {cat.name}
              </button>
              <button onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name }); setShowCatModal(true); }} className="p-0.5 text-blue-500 hover:bg-blue-50 rounded"><FiEdit2 size={12} /></button>
              <button onClick={() => setDeleteCatId(cat.id)} className="p-0.5 text-red-500 hover:bg-red-50 rounded"><FiTrash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Tìm kiếm dịch vụ..." value={search} onChange={e => setSearch(e.target.value)}
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
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Hình ảnh</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Tên dịch vụ</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Danh mục</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Giá</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thời gian (phút)</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Trạng thái</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Không có dữ liệu</td></tr>
              ) : filtered.map(svc => (
                <tr key={svc.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {svc.image ? <img src={svc.image} alt="" className="w-12 h-12 object-cover rounded" /> : <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"><FiImage className="text-gray-400" /></div>}
                  </td>
                  <td className="px-4 py-3 font-medium">{svc.name}</td>
                  <td className="px-4 py-3 text-gray-600">{getCatName(svc)}</td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--primary)' }}>{formatPrice(svc.price)}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{svc.duration}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleStatus(svc)}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${svc.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {svc.isActive !== false ? 'Hoạt động' : 'Ngừng'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(svc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 size={16} /></button>
                      <button onClick={() => setDeleteId(svc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><FiTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dịch vụ *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }}>
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VND) *</label>
                  <input type="number" required min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian (phút) *</label>
                  <input type="number" required min="1" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
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

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
              <button onClick={() => setShowCatModal(false)} className="p-1 hover:bg-gray-100 rounded"><FiX size={20} /></button>
            </div>
            <form onSubmit={handleCatSubmit}>
              <input type="text" required value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} placeholder="Tên danh mục"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2" style={{ '--tw-ring-color': 'var(--primary-light)' }} />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: 'var(--primary)' }}>
                  {editingCat ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmations */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xóa dịch vụ này?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
      {deleteCatId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa danh mục</h3>
            <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xóa danh mục này?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCatId(null)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Hủy</button>
              <button onClick={handleDeleteCat} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiImage, FiClock, FiTag, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [deleteCatId, setDeleteCatId] = useState(null);

  // Forms
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '', categoryId: '', image: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [catForm, setCatForm] = useState({ name: '' });

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const filtered = services.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || (s.categoryId?.id || s.categoryId) === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 pb-20 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-display">Danh Mục Dịch Vụ</h1>
          <p className="text-gray-500 mt-1">Quản lý menu kỹ thuật (Layer 4 - Catalog)</p>
        </div>
        <button 
          onClick={openCreate} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold shadow-lg shadow-brown-100 transition-all hover:scale-105 active:scale-95 border-0 cursor-pointer"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <FiPlus fontSize={20} /> THÊM DỊCH VỤ MỚI
        </button>
      </div>

      {/* Category Pills & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 overflow-x-auto custom-scrollbar">
           <div className="flex items-center gap-2 shrink-0 border-r border-gray-100 pr-4">
              <FiTag className="text-[#8B5E3C]" />
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Danh mục:</span>
              <button onClick={() => { setEditingCat(null); setCatForm({ name: '' }); setShowCatModal(true); }}
                className="w-8 h-8 rounded-lg bg-gray-50 text-[#8B5E3C] border-0 cursor-pointer hover:bg-[#8B5E3C] hover:text-white transition-all"><FiPlus size={16} /></button>
           </div>
           <div className="flex gap-2 shrink-0">
             <button onClick={() => setFilterCat('')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${!filterCat ? 'bg-[#8B5E3C] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                TẤT CẢ
             </button>
             {categories.map(cat => (
                <div key={cat.id} className="group relative flex items-center">
                  <button onClick={() => setFilterCat(cat.id)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border-0 cursor-pointer ${filterCat === cat.id ? 'bg-[#8B5E3C] text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                    {cat.name.toUpperCase()}
                  </button>
                  <div className="absolute -top-2 -right-1 hidden group-hover:flex gap-1">
                     <button onClick={(e) => { e.stopPropagation(); setEditingCat(cat); setCatForm({ name: cat.name }); setShowCatModal(true); }} className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm"><FiEdit2 size={8} /></button>
                     <button onClick={(e) => { e.stopPropagation(); setDeleteCatId(cat.id); }} className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm"><FiTrash2 size={8} /></button>
                  </div>
                </div>
             ))}
           </div>
        </div>

        <div className="lg:col-span-4 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm tên dịch vụ..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl text-sm shadow-sm outline-none focus:ring-2 focus:ring-[#8B5E3C]" 
            />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-12 h-12 border-4 border-gray-100 border-t-[#8B5E3C] rounded-full animate-spin mb-4" />
           <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Đang tải danh mục...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-400">Không tìm thấy dịch vụ nào</div>
          ) : filtered.map(svc => (
            <div key={svc.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
               <div className="aspect-[4/3] overflow-hidden relative">
                  {svc.image ? (
                    <img src={svc.image} alt={svc.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                      <FiImage size={40} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${svc.isActive !== false ? 'bg-green-500 text-white' : 'bg-red-500 text-white shadow-lg'}`}>
                       {svc.isActive !== false ? 'Active' : 'Stopped'}
                     </span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <button onClick={() => openEdit(svc)} className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center cursor-pointer border-0 shadow-lg hover:scale-110 active:scale-95 transition-all"><FiEdit2 /></button>
                     <button onClick={() => setDeleteId(svc.id)} className="w-10 h-10 rounded-full bg-white text-red-600 flex items-center justify-center cursor-pointer border-0 shadow-lg hover:scale-110 active:scale-95 transition-all"><FiTrash2 /></button>
                     <button onClick={() => toggleStatus(svc)} className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center cursor-pointer border-0 shadow-lg hover:scale-110 active:scale-95 transition-all"><FiCheckCircle className={svc.isActive ? 'text-green-500' : 'text-gray-300'} /></button>
                  </div>
               </div>
               <div className="p-6">
                  <p className="text-[10px] font-black text-[#8B5E3C] uppercase tracking-widest mb-1">{(categories.find(c => c.id === svc.categoryId)?.name || 'Dịch vụ').toUpperCase()}</p>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{svc.name}</h3>
                  <div className="flex items-center justify-between mt-4">
                     <div className="flex flex-col">
                        <span className="text-xs text-gray-400 font-bold flex items-center gap-1"><FiClock size={12} /> {svc.duration} phút</span>
                        <span className="text-xl font-black text-gray-900 mt-1">{formatPrice(svc.price)}</span>
                     </div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals - Simplified for Readability */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto animate-scale-up custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-display">{editing ? 'Hiệu chỉnh dịch vụ' : 'Đăng ký dịch vụ mới'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors border-0 cursor-pointer bg-transparent"><FiX size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tên dịch vụ *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Mô tả chi tiết</label>
                    <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none resize-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Danh mục *</label>
                    <select required value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none appearance-none">
                      <option value="">Chọn nhóm...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Thời gian (phút) *</label>
                    <input type="number" required min="1" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Đơn giá (VND) *</label>
                    <input type="number" required min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-[#8B5E3C] outline-none" />
                 </div>
                 <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Ảnh đại diện</label>
                    <label className="flex items-center justify-center gap-2 w-full py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                       <FiImage className="text-gray-400" />
                       <span className="text-xs font-bold text-gray-500 uppercase">{form.image ? 'Đã chọn ảnh' : 'Tải ảnh lên'}</span>
                       <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                 </div>
              </div>
              
              {imagePreview && (
                 <div className="relative w-32 h-32 rounded-3xl overflow-hidden shadow-md">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImagePreview(null); setForm({...form, image: null}); }} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center border-0 cursor-pointer shadow-sm"><FiX size={12} /></button>
                 </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all border-0 cursor-pointer">HUỶ BỎ</button>
                <button type="submit" disabled={submitting} className="flex-[2] py-4 bg-[#8B5E3C] text-white font-black rounded-2xl shadow-lg shadow-brown-100 hover:scale-[1.02] active:scale-95 transition-all border-0 cursor-pointer disabled:opacity-50">
                  {submitting ? 'ĐANG LƯU...' : editing ? 'CẬP NHẬT THAY ĐỔI' : 'XÁC NHẬN THÊM MỚI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simplified Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm animate-scale-up">
            <h2 className="text-xl font-bold mb-6 font-display">{editingCat ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
            <form onSubmit={handleCatSubmit}>
              <input type="text" required value={catForm.name} onChange={e => setCatForm({ name: e.target.value })} placeholder="Tên danh mục..."
                className="w-full px-5 py-4 bg-gray-50 border-0 rounded-2xl text-sm mb-6 outline-none focus:ring-2 focus:ring-[#8B5E3C]" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCatModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border-0 cursor-pointer">HUỶ</button>
                <button type="submit" className="flex-1 py-3 bg-[#8B5E3C] text-white font-black rounded-xl border-0 cursor-pointer shadow-md">
                  {editingCat ? 'LƯU' : 'THÊM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-xs text-center animate-scale-up">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-100">
               <FiTrash2 size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa?</h3>
            <p className="text-xs text-gray-500 mb-6">Hành động này không thể hoàn tác. Dịch vụ sẽ bị gỡ khỏi menu.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl border-0 cursor-pointer">HUỶ</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl border-0 cursor-pointer shadow-lg shadow-red-100">XÓA BỎ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

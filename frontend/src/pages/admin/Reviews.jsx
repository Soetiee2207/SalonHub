import { useState, useEffect } from 'react';
import { FiStar, FiMessageSquare, FiEyeOff, FiEye, FiTrash2, FiSearch, FiCornerDownRight, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { reviewService } from '../../services/reviewService';
import moment from 'moment';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState({});
  const [filter, setFilter] = useState('all'); // all, pending_reply, hidden

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await reviewService.getAll();
      setReviews(res.data || res || []);
    } catch {
      toast.error('Lỗi tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId, type) => {
    const text = replyText[reviewId];
    if (!text?.trim()) return toast.error('Vui lòng nhập nội dung phản hồi');

    try {
      await reviewService.update(reviewId, { type, reply: text });
      toast.success('Đã gửi phản hồi');
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      fetchReviews();
    } catch {
      toast.error('Lỗi gửi phản hồi');
    }
  };

  const toggleVisibility = async (review) => {
    try {
      await reviewService.update(review.id, { 
        type: review.type, 
        isHidden: !review.isHidden 
      });
      toast.success(review.isHidden ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá');
      fetchReviews();
    } catch {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    try {
      await reviewService.delete(id);
      toast.success('Đã xóa đánh giá');
      fetchReviews();
    } catch {
      toast.error('Lỗi xóa đánh giá');
    }
  };

  const filtered = reviews.filter(r => {
    const matchesSearch = 
      r.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase()) ||
      r.targetName?.toLowerCase().includes(search.toLowerCase());
    
    if (filter === 'pending_reply') return matchesSearch && !r.reply;
    if (filter === 'hidden') return matchesSearch && r.isHidden;
    return matchesSearch;
  });

  const stats = {
    avg: reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0,
    total: reviews.length,
    pending: reviews.filter(r => !r.reply).length
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Đánh giá</h1>
          <p className="text-gray-500 text-sm">Xem và phản hồi ý kiến từ khách hàng</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                <FiStar size={20} />
             </div>
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Trung bình</p>
                <p className="text-lg font-bold">{stats.avg} / 5.0</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <FiMessageSquare size={20} />
             </div>
             <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Chờ phản hồi</p>
                <p className="text-lg font-bold text-orange-600">{stats.pending}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo khách, nội dung hoặc dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 ring-orange-100 transition-all shadow-sm"
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'pending_reply', label: 'Chưa phản hồi' },
            { id: 'hidden', label: 'Đã ẩn (Spam)' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f.id ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-100 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((rev) => (
            <div 
              key={`${rev.type}-${rev.id}`} 
              className={`bg-white rounded-3xl border transition-all p-6 ${
                rev.isHidden ? 'bg-gray-50 border-gray-200 grayscale-[0.5]' : 'border-gray-100 shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xl">
                      {rev.customerName?.charAt(0)}
                   </div>
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="font-bold text-gray-900">{rev.customerName}</h3>
                         <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase border ${
                            rev.type === 'service' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'
                         }`}>
                            {rev.type === 'service' ? 'Dịch vụ' : 'Sản phẩm'}
                         </span>
                         {rev.isHidden && (
                           <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase bg-red-50 px-2 py-0.5 rounded-lg">
                             <FiEyeOff size={10} /> Đã ẩn (Spam)
                           </span>
                         )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                         <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                               <FiStar key={i} fill={i < rev.rating ? 'currentColor' : 'none'} size={14} />
                            ))}
                         </div>
                         <span>•</span>
                         <span>{moment(rev.createdAt).format('DD/MM/YYYY HH:mm')}</span>
                         <span>•</span>
                         <span className="text-gray-600 font-medium">{rev.targetName}</span>
                      </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => toggleVisibility(rev)}
                     className={`p-2 rounded-xl border transition-all ${
                        rev.isHidden 
                        ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-800 hover:text-gray-800'
                     }`}
                     title={rev.isHidden ? "Hiện đánh giá" : "Ẩn khỏi trang công khai"}
                   >
                     {rev.isHidden ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                   </button>
                   <button 
                     onClick={() => deleteReview(rev.id)}
                     className="p-2 rounded-xl bg-white border border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500 transition-all"
                   >
                     <FiTrash2 size={18} />
                   </button>
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-4 mb-4 border border-gray-50">
                 <p className="text-gray-700 leading-relaxed italic">"{rev.comment || 'Không có bình luận'}"</p>
              </div>

              {/* Reply Section */}
              {rev.reply ? (
                <div className="ml-8 mt-4 p-4 bg-orange-50/30 rounded-2xl border border-orange-100 flex gap-3">
                   <div className="mt-1 text-orange-400"><FiCornerDownRight size={20} /></div>
                   <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                         <p className="text-xs font-bold text-orange-600 uppercase">Phản hồi từ Salon</p>
                         <p className="text-[10px] text-gray-400">{moment(rev.replyAt).fromNow()}</p>
                      </div>
                      <p className="text-sm text-gray-600">{rev.reply}</p>
                   </div>
                </div>
              ) : !rev.isHidden && (
                <div className="ml-8 mt-4">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Nhập nội dung phản hồi cho khách hàng..."
                      value={replyText[rev.id] || ''}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                      className="w-full pl-4 pr-12 py-3 bg-white border border-dashed border-gray-300 rounded-2xl focus:outline-none focus:border-orange-500 focus:ring-4 ring-orange-50 transition-all group-hover:border-gray-400 text-sm"
                    />
                    <button 
                      onClick={() => handleReply(rev.id, rev.type)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gray-800 text-white rounded-xl hover:bg-black transition-all shadow-sm"
                    >
                      <FiCheckCircle size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
             <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <FiMessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400">Không có đánh giá nào phù hợp với bộ lọc</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

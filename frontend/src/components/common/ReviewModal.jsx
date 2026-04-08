import { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  subtitle, 
  submitting = false 
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ rating, comment });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#5C4033]/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-orange-100"
          >
            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <FiX size={20} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-[#5C4033] tracking-tight">{title}</h2>
                <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">{subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating Section */}
                <div className="flex flex-col items-center py-4 bg-orange-50/30 rounded-2xl border border-orange-100/50">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform active:scale-90"
                      >
                        <FiStar
                          size={32}
                          className={`transition-all duration-300 ${
                            star <= (hoveredStar || rating)
                              ? 'text-amber-400 fill-amber-400 scale-110'
                              : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-black text-orange-400 uppercase tracking-tighter">
                    {rating === 5 ? 'Tuyệt vời!' : rating >= 4 ? 'Rất hài lòng' : rating >= 3 ? 'Bình thường' : 'Chưa tốt'}
                  </span>
                </div>

                {/* Comment Area */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Chi tiết trải nghiệm
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    required
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder:text-slate-300 text-slate-600 font-medium"
                    placeholder="Hãy chia sẻ điều sư huynh/sư tỷ tâm đắc nhất..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#8B5E3C] text-white font-black rounded-2xl hover:bg-[#5C4033] transition-all shadow-xl shadow-orange-100 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>ĐANG GỬI...</span>
                    </div>
                  ) : (
                    'GỬI ĐÁNH GIÁ NGAY'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

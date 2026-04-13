import { useState } from 'react';
import { FiX, FiInfo, FiUpload, FiTrash2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReturnModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  orderId,
  submitting = false 
}) {
  const [reason, setReason] = useState('');
  const [images, setImages] = useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    // In a real app, you would upload to a server/S3
    // For now, we simulate with local URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ orderId, reason, images });
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-slate-100"
          >
            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <FiX size={20} />
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Yêu cầu trả hàng</h2>
                <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-widest">ĐƠN HÀNG #{String(orderId).padStart(6, '0')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-700 text-sm">
                  <FiInfo className="shrink-0 mt-0.5" size={18} />
                  <p>Sản phẩm chỉ có thể trả lại nếu còn nguyên tem mác hoặc bị hư hỏng trong quá trình vận chuyển. Chúng tôi sẽ xem xét yêu cầu trong vòng 24-48h.</p>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Lý do trả hàng <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    required
                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[var(--primary-light)] outline-none transition-all placeholder:text-slate-300 text-slate-600 font-medium"
                    placeholder="Vui lòng mô tả chi tiết tình trạng sản phẩm hoặc lý do bạn muốn trả hàng..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                    Hình ảnh bằng chứng (Tối đa 5 ảnh)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 ring-1 ring-slate-100 group">
                        <img src={img} alt="proof" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-[var(--primary)] hover:bg-slate-50 transition-all flex flex-col items-center justify-center text-slate-400 cursor-pointer">
                        <FiUpload size={20} />
                        <span className="text-[10px] font-bold mt-1">TẢI LÊN</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="w-full py-4 bg-[var(--primary)] text-white font-black rounded-2xl hover:bg-[var(--primary-dark)] transition-all shadow-xl shadow-slate-100 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>ĐANG XỬ LÝ...</span>
                    </div>
                  ) : (
                    'GỬI YÊU CẦU TRẢ HÀNG'
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

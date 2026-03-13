import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiTag, FiImage, FiArrowLeft } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      try {
        const res = await serviceService.getById(id);
        const data = res.data || res;
        setService(data);

        // Fetch related services in same category
        const allRes = await serviceService.getAll();
        const all = allRes.data || allRes;
        const categoryId = data.categoryId || data.category?.id;
        const related = all.filter(
          (s) => s.id !== data.id && (s.categoryId === categoryId || s.category?.id === categoryId)
        );
        setRelatedServices(related.slice(0, 4));
      } catch (err) {
        console.error('Lỗi khi tải dịch vụ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-500">
        Không tìm thấy dịch vụ.
      </div>
    );
  }

  const categoryName = service.category?.name || '';

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-[var(--primary)] hover:underline mb-6 text-sm font-medium"
        >
          <FiArrowLeft />
          Quay lại danh sách dịch vụ
        </button>

        {/* Service Detail */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            {service.image ? (
              <img
                src={service.image}
                alt={service.name}
                className="w-full h-72 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-72 md:h-full bg-gray-100 flex items-center justify-center min-h-[300px]">
                <FiImage className="text-6xl text-gray-300" />
              </div>
            )}

            {/* Info */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                {categoryName && (
                  <span className="inline-flex items-center gap-1 text-sm text-[var(--primary-light)] bg-[var(--bg-light)] px-3 py-1 rounded-full mb-3">
                    <FiTag className="text-xs" />
                    {categoryName}
                  </span>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  {service.name}
                </h1>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description || 'Chưa có mô tả cho dịch vụ này.'}
                </p>

                <div className="flex items-center gap-6 mb-6">
                  <div>
                    <span className="text-sm text-gray-400">Giá</span>
                    <p className="text-2xl font-bold text-[var(--primary)]">
                      {formatPrice(service.price)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Thời gian</span>
                    <p className="flex items-center gap-1 text-lg font-medium text-gray-700">
                      <FiClock />
                      {service.duration} phút
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate(`/book-appointment?serviceId=${service.id}`)}
                className="w-full py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-light)] transition-colors text-lg"
              >
                Đặt lịch dịch vụ này
              </button>
            </div>
          </div>
        </div>

        {/* Related Services */}
        {relatedServices.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              Dịch vụ liên quan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedServices.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/services/${s.id}`)}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {s.image ? (
                    <img src={s.image} alt={s.name} className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <FiImage className="text-3xl text-gray-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{s.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[var(--primary)] font-bold text-sm">
                        {formatPrice(s.price)}
                      </span>
                      <span className="flex items-center text-gray-400 text-xs gap-1">
                        <FiClock />
                        {s.duration} phút
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

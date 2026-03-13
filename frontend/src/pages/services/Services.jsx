import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiClock } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

const CATEGORY_IMAGES = {
  'cat': 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400&q=80',
  'style': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
  'color': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80',
  'care': 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80',
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80';

function getServiceImage(service) {
  if (service.image) return service.image;
  const catName = (service.category?.name || '').toLowerCase();
  if (catName.includes('cắt') || catName.includes('cat')) return CATEGORY_IMAGES.cat;
  if (catName.includes('uốn') || catName.includes('tạo kiểu') || catName.includes('style')) return CATEGORY_IMAGES.style;
  if (catName.includes('nhuộm') || catName.includes('màu') || catName.includes('color')) return CATEGORY_IMAGES.color;
  if (catName.includes('chăm sóc') || catName.includes('dưỡng') || catName.includes('care')) return CATEGORY_IMAGES.care;
  return FALLBACK_IMAGE;
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, categoriesRes] = await Promise.all([
          serviceService.getAll(),
          serviceService.getCategories(),
        ]);
        setServices(servicesRes.data || servicesRes);
        setCategories(categoriesRes.data || categoriesRes);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = services.filter((s) => {
    const matchCategory = !selectedCategory || s.categoryId === selectedCategory || s.category?.id === selectedCategory;
    const matchSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
        <p style={{ fontFamily: 'var(--font-body)' }} className="text-sm text-[var(--primary-light)]">
          Đang tải dịch vụ...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Hero Banner */}
      <div className="relative h-[320px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=1200&q=80"
          alt="Dịch vụ salon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Dịch vụ của chúng tôi
          </h1>
          <p
            style={{ fontFamily: 'var(--font-body)' }}
            className="text-white/80 text-lg max-w-xl"
          >
            Khám phá các dịch vụ chăm sóc tóc chuyên nghiệp tại SalonHub
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Search Bar */}
        <div className="relative mb-8 max-w-lg mx-auto">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-light)] text-lg" />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontFamily: 'var(--font-body)' }}
            className="w-full pl-12 pr-4 py-3 rounded-full border border-[var(--bg-warm)] bg-white focus:outline-none focus:border-[var(--primary-light)] text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedCategory(null)}
            style={{ fontFamily: 'var(--font-body)' }}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              !selectedCategory
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white text-[var(--primary)] border border-[var(--accent)] hover:bg-[var(--bg-warm)]'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{ fontFamily: 'var(--font-body)' }}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-[var(--primary)] border border-[var(--accent)] hover:bg-[var(--bg-warm)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-400 text-lg">
              Không tìm thấy dịch vụ nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                className="group bg-white rounded-2xl overflow-hidden cursor-pointer border border-[var(--bg-warm)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image with hover overlay */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={getServiceImage(service)}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[var(--primary)]/80 px-5 py-2 rounded-full text-sm"
                    >
                      Xem chi tiết
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  {service.category?.name && (
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="inline-block text-xs font-medium text-[var(--accent-gold)] bg-[var(--bg-warm)] px-3 py-1 rounded-full mb-3 uppercase tracking-wide"
                    >
                      {service.category.name}
                    </span>
                  )}
                  <h3
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="text-xl font-semibold text-gray-800 mb-3 line-clamp-1"
                  >
                    {service.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="text-[var(--primary)] font-bold text-lg"
                    >
                      {formatPrice(service.price)}
                    </span>
                    <span
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="flex items-center text-gray-400 text-sm gap-1.5"
                    >
                      <FiClock className="text-base" />
                      {service.duration} phút
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiClock, FiImage } from 'react-icons/fi';
import { serviceService } from '../../services/serviceService';
import { formatPrice } from '../../utils/formatPrice';

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-[var(--primary)] mb-8">
          Dịch vụ của chúng tôi
        </h1>

        {/* Search Bar */}
        <div className="relative mb-6 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Tìm kiếm dịch vụ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] bg-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white text-gray-600 border border-gray-300 hover:border-[var(--primary)] hover:text-[var(--primary)]'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-[var(--primary)] hover:text-[var(--primary)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            Không tìm thấy dịch vụ nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/services/${service.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Image */}
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <FiImage className="text-4xl text-gray-300" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--primary)] font-bold text-lg">
                      {formatPrice(service.price)}
                    </span>
                    <span className="flex items-center text-gray-400 text-sm gap-1">
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

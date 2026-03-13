import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { productService } from '../../services/productService';
import { cartService } from '../../services/cartService';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatPrice';

const PRODUCT_FALLBACK = 'https://images.unsplash.com/photo-1597854710218-d2f1064e3b3e?w=400&q=80';

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    productService.getCategories()
      .then((res) => setCategories(res.data || res))
      .catch(() => {});
  }, []);

  const fetchProducts = (params = {}) => {
    setLoading(true);
    if (selectedCategory) params.category = selectedCategory;
    if (search) params.search = search;
    if (sort) params.sort = sort;

    productService.getAll(params)
      .then((res) => setProducts(res.data || res))
      .catch(() => toast.error('Không thể tải danh sách sản phẩm'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate('/login');
      return;
    }
    setAddingToCart(product.id);
    try {
      await cartService.addToCart({ productId: product.id, quantity: 1 });
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng`);
    } catch (err) {
      toast.error(err.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Hero Banner */}
      <div className="relative h-[320px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1200&q=80"
          alt="Sản phẩm chăm sóc tóc"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4">
          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Sản phẩm chăm sóc tóc
          </h1>
          <p
            style={{ fontFamily: 'var(--font-body)' }}
            className="text-white/80 text-lg max-w-xl"
          >
            Những sản phẩm chất lượng cao được chọn lọc dành riêng cho mái tóc của bạn
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex gap-2 w-full lg:w-auto">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary-light)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                style={{ fontFamily: 'var(--font-body)' }}
                className="w-full pl-12 pr-4 py-3 rounded-full border border-[var(--bg-warm)] bg-white focus:outline-none focus:border-[var(--primary-light)] text-gray-700 placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              style={{ fontFamily: 'var(--font-body)' }}
              className="px-6 py-3 bg-[var(--primary)] text-white rounded-full hover:bg-[var(--primary-light)] transition-colors font-medium"
            >
              Tìm kiếm
            </button>
          </form>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-[var(--primary-light)]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ fontFamily: 'var(--font-body)' }}
              className="border border-[var(--bg-warm)] rounded-full px-5 py-3 bg-white focus:outline-none focus:border-[var(--primary-light)] text-gray-700 text-sm"
            >
              <option value="newest">Mới nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedCategory('')}
            style={{ fontFamily: 'var(--font-body)' }}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === ''
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

        {/* Loading */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-20 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--primary)]"></div>
            <p style={{ fontFamily: 'var(--font-body)' }} className="text-sm text-[var(--primary-light)]">
              Đang tải sản phẩm...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && products.length === 0 && (
          <div className="text-center py-20">
            <p style={{ fontFamily: 'var(--font-body)' }} className="text-gray-400 text-lg">
              Không tìm thấy sản phẩm nào
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                to={`/products/${product.id}`}
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-[var(--bg-warm)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.image || PRODUCT_FALLBACK}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Hover overlay with add to cart */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end justify-center pb-4">
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingToCart === product.id || product.stock === 0}
                      style={{ fontFamily: 'var(--font-body)' }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-[var(--primary)] rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-[var(--primary)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiShoppingCart size={14} />
                      Thêm vào giỏ
                    </button>
                  </div>
                  {/* Stock badge */}
                  <span
                    style={{ fontFamily: 'var(--font-body)' }}
                    className={`absolute top-3 right-3 text-xs font-medium px-3 py-1 rounded-full ${
                      product.stock > 0
                        ? 'bg-white/90 text-green-700'
                        : 'bg-red-50/90 text-red-600'
                    }`}
                  >
                    {product.stock > 0 ? `Còn ${product.stock}` : 'Hết hàng'}
                  </span>
                </div>
                <div className="p-4">
                  <h3
                    style={{ fontFamily: 'var(--font-display)' }}
                    className="font-semibold text-gray-800 mb-1 line-clamp-2 text-base"
                  >
                    {product.name}
                  </h3>
                  <p
                    style={{ fontFamily: 'var(--font-body)' }}
                    className="text-sm text-gray-400 mb-3 line-clamp-1"
                  >
                    {product.description}
                  </p>
                  <p
                    style={{ fontFamily: 'var(--font-body)' }}
                    className="text-lg font-bold text-[var(--primary)]"
                  >
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

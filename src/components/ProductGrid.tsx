import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCartStore } from '../stores/cartStore';
import { Star } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm] = useDebounce(searchInput, 300);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const cartStore = useCartStore();

  const loadProducts = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          (
            SELECT 
              COALESCE(AVG(rating), 0) as average_rating,
              COUNT(*) as review_count
            FROM reviews
            WHERE reviews.product_id = products.id
            AND reviews.approved = true
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400"
            fill="currentColor"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-yellow-400"
            fill="currentColor"
            strokeWidth={3}
          />
        );
      } else {
        stars.push(
          <Star
            key={i}
            className="h-4 w-4 text-gray-300"
          />
        );
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadProducts}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <Link to={`/product/${product.id}`} className="block">
            <div className="aspect-w-1 aspect-h-1 w-full">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {product.name}
              </h3>
              <p className="text-xl font-bold text-indigo-600 mt-1">
                ${product.price.toFixed(2)}
              </p>
              
              <div className="flex items-center mt-2">
                <div className="flex items-center">
                  {renderStars(product.average_rating || 0)}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {product.review_count ? (
                    <>
                      ({product.average_rating?.toFixed(1)}) 
                      <span className="text-gray-500">
                        {product.review_count} {product.review_count === 1 ? 'reseña' : 'reseñas'}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500">Sin calificaciones</span>
                  )}
                </span>
              </div>

              {product.stock > 0 ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    cartStore.addItem(product, 1);
                  }}
                  className="mt-4 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Agregar al carrito
                </button>
              ) : (
                <p className="mt-4 text-center text-red-600 py-2">Agotado</p>
              )}
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
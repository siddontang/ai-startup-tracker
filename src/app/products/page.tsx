'use client';

import { useEffect, useState } from 'react';

interface Product {
  id: number; name: string; company: string; url: string; description: string;
  category: string; region: string; launched_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    setLoading(true);
    fetch(`/api/products${params}`).then(r => r.json()).then(json => {
      setProducts(json.data || []);
      if (json.categories) setCategories(json.categories);
    }).finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                {p.category && <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">{p.category}</span>}
              </div>
              {p.company && <p className="text-gray-400 text-sm">{p.company}</p>}
              {p.description && <p className="text-gray-300 text-sm mt-2 line-clamp-3">{p.description}</p>}
              <div className="flex justify-between items-center mt-3">
                {p.region && <span className="text-gray-500 text-xs">{p.region}</span>}
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">Visit →</a>}
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-gray-400 col-span-3 text-center py-12">No products found</p>}
        </div>
      )}
    </div>
  );
}

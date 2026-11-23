import React, { useState } from 'react';
import { Image as ImageIcon, UploadCloud, Sparkles, Tag, Check } from 'lucide-react';
import { apiClient } from '../api/client';

interface ProductMatch {
  id: string;
  sku: string;
  name: string;
  category?: string;
  description?: string;
  price: number;
  image_url?: string;
  similarity_score?: number;
}

interface SearchResponse {
  query_description: string;
  matches: ProductMatch[];
}

export const VisualSearchPage: React.FC = () => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ProductMatch[]>([]);
  const [searchDesc, setSearchDesc] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setIsSearching(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await apiClient<SearchResponse>('/api/products/visual-search', {
        method: 'POST',
        body: formData,
      });
      setResults(data.matches);
      setSearchDesc(data.query_description);
    } catch (err: any) {
      alert(`Visual search error: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Visual Product Search <Sparkles className="w-5 h-5 text-emerald-600" />
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          OpenCLIP & Vector Perceptual Feature Matching for automated catalog discovery.
        </p>
      </div>

      {/* Query Image Upload */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2">
          <div className="p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl text-center relative transition-all shadow-xs">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isSearching}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <UploadCloud className="w-10 h-10 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isSearching ? 'Computing image vector features...' : 'Upload product photo to search'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP supported</p>
              </div>
            </div>
          </div>
        </div>

        {/* Query Preview */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center min-h-[160px] bg-slate-50 rounded-2xl border border-slate-200 p-4">
          {imagePreview ? (
            <div className="space-y-2 text-center">
              <img
                src={imagePreview}
                alt="Search Query"
                className="max-h-40 rounded-xl object-contain shadow-xs mx-auto border border-slate-200"
              />
              <span className="text-xs text-emerald-700 font-bold">Active Visual Query Target</span>
            </div>
          ) : (
            <div className="text-center text-slate-400 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No query image selected. Upload an image to trigger vector search.
            </div>
          )}
        </div>
      </div>

      {/* Match Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Nearest Visual Matches</h3>
          {searchDesc && <span className="text-xs text-slate-500 font-medium">{searchDesc}</span>}
        </div>

        {results.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center text-slate-400 text-sm shadow-xs">
            Upload an image above to find matching catalog products.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-300 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between shadow-xs"
              >
                <div className="h-44 bg-slate-50 flex items-center justify-center p-4 border-b border-slate-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-400">{product.sku}</span>
                      {product.similarity_score !== undefined && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {(product.similarity_score * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{product.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase">{product.category || 'General'}</span>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">${product.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

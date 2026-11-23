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
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Visual Product Search <Sparkles className="w-5 h-5 text-emerald-400" />
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          OpenCLIP & Vector Perceptual Feature Matching for automated catalog discovery.
        </p>
      </div>

      {/* Query Image Upload */}
      <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-8">
        <div className="w-full md:w-1/2">
          <div className="p-8 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl text-center relative transition-colors bg-slate-900/40">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isSearching}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              <UploadCloud className="w-10 h-10 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {isSearching ? 'Computing image vectors...' : 'Upload product photo to search'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP supported</p>
              </div>
            </div>
          </div>
        </div>

        {/* Query Preview */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center min-h-[160px] bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          {imagePreview ? (
            <div className="space-y-2 text-center">
              <img
                src={imagePreview}
                alt="Search Query"
                className="max-h-40 rounded-xl object-contain shadow-md mx-auto"
              />
              <span className="text-[11px] text-emerald-400 font-medium">Active Visual Query</span>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No query image selected. Upload an image to trigger vector search.
            </div>
          )}
        </div>
      </div>

      {/* Match Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Nearest Visual Matches</h3>
          {searchDesc && <span className="text-xs text-slate-400">{searchDesc}</span>}
        </div>

        {results.length === 0 ? (
          <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center text-slate-500 text-sm">
            Upload an image above to find matching catalog products.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((product) => (
              <div
                key={product.id}
                className="bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="h-44 bg-slate-900 flex items-center justify-center p-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-700" />
                  )}
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-500">{product.sku}</span>
                      {product.similarity_score !== undefined && (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {(product.similarity_score * 100).toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-sm text-slate-100 mt-1">{product.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-500 uppercase">{product.category || 'General'}</span>
                    <span className="text-sm font-bold text-white font-mono">${product.price.toFixed(2)}</span>
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

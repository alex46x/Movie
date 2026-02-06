import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ContentType, ContentItem } from '../types';
import { ApiService } from '../services/api';
import { ContentCard } from '../components/ContentCard';
import { Filter, ArrowUpDown, AlertTriangle, RefreshCw, ChevronDown, Check, X, Tag } from 'lucide-react';
import { parseSearchQuery } from '../utils/searchLogic';

interface CatalogProps {
  type?: ContentType;
  title: string;
}

type SortOption = 'latest' | 'oldest' | 'year-desc' | 'year-asc' | 'popular' | 'title-asc' | 'title-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: 'Latest Added' },
  { value: 'oldest', label: 'Oldest Added' },
  { value: 'popular', label: 'Popularity' },
  { value: 'year-desc', label: 'Year (Newest)' },
  { value: 'year-asc', label: 'Year (Oldest)' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
];

export const Catalog: React.FC<CatalogProps> = ({ type, title: initialTitle }) => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  
  const searchQuery = searchParams.get('q') || '';
  const filterCategory = searchParams.get('category');
  const filterTag = searchParams.get('filter');

  const pageTitle = useMemo(() => {
    if (filterCategory && filterTag) return `${filterTag} ${filterCategory}`;
    if (filterCategory) return filterCategory;
    if (searchQuery) return `Results for "${searchQuery}"`;
    return initialTitle;
  }, [filterCategory, filterTag, searchQuery, initialTitle]);

  const searchIntent = useMemo(() => {
    return parseSearchQuery(searchQuery);
  }, [searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allData = await ApiService.getAllContent();
      
      let filtered = type ? allData.filter(i => i.type === type) : allData;
      setItems(filtered);
    } catch (err) {
      console.error("Catalog fetch error:", err);
      const message = err instanceof Error ? err.message : "Unable to load content at this time. Please check your connection.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedItems = useMemo(() => {
    if (!items) return [];

    let result = items;

    if (filterCategory) {
       result = result.filter(item => {
           if (filterCategory === 'Movies' && item.type === ContentType.Movie) return true;
           if (filterCategory === 'Web Series' && item.type === ContentType.Series) return true;
           if (filterCategory === 'Anime / Cartoon' && item.type === ContentType.Cartoon) return true;
           if (filterCategory === 'TV Shows' && item.type === ContentType.Series) return true;
           return false;
       });
    }

    if (filterTag) {
        const ft = filterTag.toLowerCase();
        result = result.filter(item => {
             if (item.industry && item.industry.toLowerCase() === ft) return true;
             if (item.language && item.language.toLowerCase() === ft) return true;
             if (ft === 'hindi (bollywood)' && item.industry === 'Bollywood') return true;
             if (item.genres && item.genres.some(g => g.toLowerCase() === ft)) return true;
             if (ft === 'dual audio' && item.language?.toLowerCase().includes('dual')) return true;
             return false;
        });
    }

    if (searchQuery) {
        if (searchIntent.types.length > 0) {
            result = result.filter(item => searchIntent.types.includes(item.type));
        }

        if (searchIntent.industries.length > 0) {
            result = result.filter(item => searchIntent.industries.includes(item.industry));
        }

        if (searchIntent.languages.length > 0) {
            result = result.filter(item => {
                if (!item.language) {
                    if (item.industry === 'Hollywood' && searchIntent.languages.includes('english')) return true;
                    if (item.industry === 'Anime' && searchIntent.languages.includes('japanese')) return true;
                    return false;
                }
                return searchIntent.languages.includes(item.language.toLowerCase());
            });
        }

        if (searchIntent.genres.length > 0) {
            result = result.filter(item => {
                if (!item.genres) return false;
                return searchIntent.genres.some(sg => 
                    item.genres!.some(ig => ig.toLowerCase().includes(sg.toLowerCase()))
                );
            });
        }

        if (searchIntent.text) {
            result = result.filter(item => 
                item.title.toLowerCase().includes(searchIntent.text)
            );
        }
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'latest': 
          return b.createdAt - a.createdAt;
        case 'oldest': 
          return a.createdAt - b.createdAt;
        case 'year-desc': 
          return (b.releaseYear || 0) - (a.releaseYear || 0);
        case 'year-asc': 
          return (a.releaseYear || 0) - (b.releaseYear || 0);
        case 'popular': 
          return (b.views || 0) - (a.views || 0);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchQuery, searchIntent, sortBy, filterCategory, filterTag]);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort By';

  const removeKeyword = (keyword: string) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const newQuery = searchQuery.replace(regex, '').replace(/\s+/g, ' ').trim();
      setSearchParams({ q: newQuery });
  };

  const clearNavFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = searchIntent.originalKeywords.length > 0 || !!filterCategory || !!filterTag;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-red-500/10 p-4 rounded-full mb-4 ring-1 ring-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Failed to load content</h2>
        <p className="text-slate-400 mb-8 max-w-md leading-relaxed">{error}</p>
        <button 
          onClick={fetchData}
          className="group flex items-center gap-2 bg-primary hover:bg-indigo-600 text-white px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" /> 
          <span className="font-medium">Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
            <h1 className="text-3xl font-bold text-white">{pageTitle}</h1>
            <p className="text-slate-400 text-sm mt-1">
                {displayedItems.length} result{displayedItems.length !== 1 && 's'} found
            </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center relative z-10">
                <div className="relative" ref={sortRef}>
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-3 bg-surface border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2.5 transition-all text-sm min-w-[200px] justify-between group"
                    >
                        <div className="flex items-center gap-2 text-slate-300">
                            <ArrowUpDown className="w-4 h-4 text-primary" />
                            <span>{currentSortLabel}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSortOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-20">
                            <div className="py-1">
                                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50">
                                    Sort Content By
                                </div>
                                {SORT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => {
                                            setSortBy(option.value);
                                            setIsSortOpen(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                                            sortBy === option.value 
                                                ? 'bg-primary/10 text-primary' 
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        {option.label}
                                        {sortBy === option.value && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-left-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Filters:</span>
                
                {filterCategory && (
                    <button
                        onClick={clearNavFilters}
                        className="group flex items-center gap-2 bg-indigo-500/10 hover:bg-red-500/10 border border-indigo-500/20 hover:border-red-500/30 text-indigo-300 hover:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    >
                        <Tag className="w-3 h-3 opacity-70" />
                        <span>{filterCategory}</span>
                        <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </button>
                )}

                {filterTag && (
                    <button
                        onClick={() => {
                             const params = new URLSearchParams(searchParams);
                             params.delete('filter');
                             setSearchParams(params);
                        }}
                        className="group flex items-center gap-2 bg-indigo-500/10 hover:bg-red-500/10 border border-indigo-500/20 hover:border-red-500/30 text-indigo-300 hover:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    >
                        <Tag className="w-3 h-3 opacity-70" />
                        <span>{filterTag}</span>
                        <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </button>
                )}

                {searchIntent.originalKeywords.map((keyword, idx) => (
                    <button
                        key={idx}
                        onClick={() => removeKeyword(keyword)}
                        className="group flex items-center gap-2 bg-indigo-500/10 hover:bg-red-500/10 border border-indigo-500/20 hover:border-red-500/30 text-indigo-300 hover:text-red-400 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    >
                        <Tag className="w-3 h-3 opacity-70" />
                        <span className="capitalize">{keyword}</span>
                        <X className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </button>
                ))}
            </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {displayedItems.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
            <div className="inline-block p-4 rounded-full bg-surface mb-4">
                <Filter className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-400">No matching content found.</p>
            <p className="text-sm mt-2 opacity-70">
                {searchIntent.text 
                    ? `No titles match "${searchIntent.text}" within your filters.`
                    : "Try removing some filters or checking your spelling."}
            </p>
             <button onClick={clearNavFilters} className="mt-4 text-primary hover:underline text-sm font-medium">Clear All Filters</button>
        </div>
      )}
    </div>
  );
};
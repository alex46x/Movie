import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, Film, Tv, MonitorPlay, Sparkles } from 'lucide-react';
import { ContentItem, ContentType } from '../types';
import { ApiService } from '../services/api';
import { searchContent, SearchResult } from '../utils/searchLogic';

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ 
  placeholder = "Search movies, series...", 
  className = "",
  onClose,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState<ContentItem[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    ApiService.getAllContent().then(items => {
        setAllItems(items);
    }).catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    const timer = setTimeout(() => {
      const searchResults = searchContent(allItems, trimmedQuery);
      setResults(searchResults.slice(0, 6)); 
      setIsLoading(false);
      setActiveIndex(-1);
    }, 200);

    return () => clearTimeout(timer);
  }, [query, allItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && query) setIsOpen(true);
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex].item);
      } else {
        navigate(`/?q=${encodeURIComponent(query)}`);
        setIsOpen(false);
        if(onClose) onClose();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setIsFocused(false);
      if(onClose) onClose();
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: ContentItem) => {
    navigate(`/content/${item.id}`);
    setQuery('');
    setIsOpen(false);
    setIsFocused(false);
    if(onClose) onClose();
  };

  const handleFocus = () => {
      setIsFocused(true);
      if(query.trim()) setIsOpen(true);
      loadData();
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case ContentType.Movie: return <Film className="w-3 h-3" />;
      case ContentType.Series: return <Tv className="w-3 h-3" />;
      case ContentType.Cartoon: return <MonitorPlay className="w-3 h-3" />;
      default: return <Film className="w-3 h-3" />;
    }
  };

  const renderTitle = (title: string, matchType: string) => {
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return title;
    if (matchType === 'fuzzy') return title;

    const safeQuery = escapeRegExp(trimmedQuery);
    const fullMatchRegex = new RegExp(`(${safeQuery})`, 'gi');
    
    const parts = title.split(fullMatchRegex);
    if (parts.length > 1) {
        return (
            <>
            {parts.map((part, i) => 
                part.toLowerCase() === trimmedQuery.toLowerCase() ? (
                <span key={i} className="text-indigo-400 font-bold bg-indigo-500/10 rounded-sm px-0.5">{part}</span>
                ) : (
                <span key={i}>{part}</span>
                )
            )}
            </>
        );
    }
    return title;
  };

  const topResult = results[0];
  const isTypoCorrection = topResult?.matchType === 'fuzzy';

  return (
    <div ref={wrapperRef} className={`relative w-full transition-all duration-300 ${className}`}>
      <div className={`relative group flex items-center bg-slate-900/50 border rounded-xl transition-all duration-300 ${isFocused || query ? 'border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] bg-slate-900' : 'border-slate-700/50 hover:border-slate-600'}`}>
        <div className="pl-3.5 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
          ) : (
            <Search className={`h-4 w-4 transition-colors ${isFocused ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => {
              setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-slate-200 text-sm border-none focus:ring-0 placeholder-slate-500 px-3 py-2.5 h-[42px]"
          autoComplete="off"
        />

        {query && (
          <button 
            onClick={() => { setQuery(''); setIsOpen(false); inputRef.current?.focus(); }}
            className="pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 ring-1 ring-white/5">
          {results.length > 0 ? (
            <ul>
              {isTypoCorrection && (
                  <li className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
                      <div className="text-xs text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Did you mean: <span className="font-bold text-white cursor-pointer hover:underline" onClick={() => handleSelect(topResult.item)}>{topResult.item.title}</span>?
                      </div>
                  </li>
              )}

              {!isTypoCorrection && (
                <li className="px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/80 border-b border-slate-800/50">
                  Suggestions
                </li>
              )}

              {results.map((result, index) => (
                <li key={result.item.id}>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(result.item)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-slate-800/50 last:border-0 group ${
                      index === activeIndex ? 'bg-indigo-600/10' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex-shrink-0 w-8 h-12 rounded overflow-hidden bg-slate-800 relative shadow-md group-hover:ring-1 group-hover:ring-indigo-500/30 transition-all">
                      <img src={result.item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className={`text-sm font-medium truncate ${isTypoCorrection && index === 0 ? 'text-indigo-200' : 'text-slate-200 group-hover:text-white'}`}>
                        {renderTitle(result.item.title, result.matchType)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20">
                          {getTypeIcon(result.item.type)} {result.item.type}
                        </span>
                        <span className="text-[10px] text-slate-500">• {result.item.releaseYear}</span>
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                        <Search className="w-3 h-3 text-slate-500" />
                    </div>
                  </button>
                </li>
              ))}
              
              <li className="p-2 bg-slate-900/50 text-center border-t border-slate-800/50">
                 <button 
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { navigate(`/?q=${encodeURIComponent(query)}`); setIsOpen(false); if(onClose) onClose(); }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1"
                 >
                    View all results
                 </button>
              </li>
            </ul>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Film className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium text-slate-400">No results found</p>
              <p className="text-xs mt-1 opacity-70">Try searching for "Inception" or "Action"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
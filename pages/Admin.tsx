import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ApiService } from '../services/api';
import { GeminiService } from '../services/geminiService';
import { ContentType, Industry, VideoQuality, ContentItem } from '../types';
import { 
    Plus, Trash2, Wand2, Loader2, Save, X, Eye, 
    AlertTriangle, AlertCircle, Pencil, CheckCircle2,
    LayoutDashboard, Film, Tv, MonitorPlay, ChevronRight,
    Filter, Search, Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ADMIN_NAV = [
    {
        id: 'dashboard',
        label: 'All Content',
        icon: <LayoutDashboard className="w-4 h-4" />,
        type: null
    },
    {
        id: 'movies',
        label: 'Movies',
        icon: <Film className="w-4 h-4" />,
        type: ContentType.Movie,
        filters: [
            { label: 'By Language', key: 'language', options: ['Hindi', 'English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bangla'] },
            { label: 'By Genre', key: 'genres', options: ['Action', 'Horror', 'Thriller', 'Comedy', 'Romance', 'Drama', 'Sci-Fi'] },
            { label: 'By Industry', key: 'industry', options: Object.values(Industry) }
        ]
    },
    {
        id: 'series',
        label: 'Web Series',
        icon: <Tv className="w-4 h-4" />,
        type: ContentType.Series,
        filters: [
            { label: 'By Language', key: 'language', options: ['Hindi', 'English', 'Tamil', 'Telugu'] },
            { label: 'By Industry', key: 'industry', options: Object.values(Industry) }
        ]
    },
    {
        id: 'anime',
        label: 'Anime / Cartoon',
        icon: <MonitorPlay className="w-4 h-4" />,
        type: ContentType.Cartoon,
        filters: [
            { label: 'By Type', key: 'industry', options: [Industry.Anime, 'Cartoon'] }
        ]
    }
];

export const Admin: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  
  const [activeNavId, setActiveNavId] = useState<string>('dashboard');
  const [activeFilter, setActiveFilter] = useState<{ key: string; value: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    if (!process.env.API_KEY) setApiKeyMissing(true);
  }, []);

  useEffect(() => {
    if (successMsg || error) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, error]);

  const loadItems = async () => {
    try {
        const data = await ApiService.getAllContent();
        setItems(data);
    } catch (err) {
        console.error(err);
        setError("Failed to fetch inventory items from backend.");
    }
  };

  const filteredItems = useMemo(() => {
    let result = items;
    const currentNav = ADMIN_NAV.find(n => n.id === activeNavId);

    if (currentNav && currentNav.type) {
        result = result.filter(item => item.type === currentNav.type);
    }

    if (activeFilter) {
        result = result.filter(item => {
            if (activeFilter.key === 'language') {
                return item.language === activeFilter.value;
            }
            if (activeFilter.key === 'industry') {
                return item.industry === activeFilter.value;
            }
            if (activeFilter.key === 'genres') {
                return item.genres?.includes(activeFilter.value);
            }
            return true;
        });
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.id.includes(q)
        );
    }

    return result;
  }, [items, activeNavId, activeFilter, searchQuery]);

  const handleNavClick = (navId: string) => {
      setActiveNavId(navId);
      setActiveFilter(null); 
      setView('list');
  };

  const handleFilterClick = (key: string, value: string) => {
      setActiveFilter({ key, value });
      setView('list');
  };

  const handleEdit = (item: ContentItem) => {
      setEditingItem(item);
      setView('form');
      setSuccessMsg(null);
      setError(null);
  };

  const handleCreate = () => {
      setEditingItem(null);
      setView('form');
      setSuccessMsg(null);
      setError(null);
  };

  const handleCancel = () => {
      setView('list');
      setEditingItem(null);
      setError(null);
  };

  const handleSuccess = (msg: string) => {
      setView('list');
      setEditingItem(null);
      setSuccessMsg(msg);
      loadItems();
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?\nThis action cannot be undone.`)) {
      setDeletingId(id);
      
      const originalItems = [...items];
      // Optimistic update
      setItems(items.filter(item => item.id !== id));

      try {
          setError(null);
          await ApiService.deleteContent(id);
          setSuccessMsg("Content deleted successfully");
          await loadItems();
      } catch (err) {
          console.error(err);
          setItems(originalItems);
          setError("Failed to delete item from server. Please try again.");
      } finally {
          setDeletingId(null);
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)]">
      
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex-shrink-0 hidden md:block overflow-y-auto max-h-[calc(100vh-80px)] sticky top-20">
        <div className="p-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Admin Panel</h2>
            <nav className="space-y-1">
                {ADMIN_NAV.map(nav => (
                    <div key={nav.id} className="mb-2">
                        <button
                            onClick={() => handleNavClick(nav.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeNavId === nav.id 
                                ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            {nav.icon}
                            {nav.label}
                            {activeNavId === nav.id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                        </button>
                        
                        {activeNavId === nav.id && nav.filters && (
                            <div className="ml-4 mt-2 space-y-4 pl-3 border-l border-slate-800 animate-in slide-in-from-left-2 duration-200">
                                {nav.filters.map(group => (
                                    <div key={group.key}>
                                        <div className="text-[10px] text-slate-600 font-bold uppercase mb-1.5">{group.label}</div>
                                        <div className="space-y-0.5">
                                            {group.options.map(option => (
                                                <button
                                                    key={option}
                                                    onClick={() => handleFilterClick(group.key, option)}
                                                    className={`block w-full text-left text-xs py-1 px-2 rounded ${
                                                        activeFilter?.key === group.key && activeFilter.value === option
                                                        ? 'bg-indigo-500 text-white'
                                                        : 'text-slate-500 hover:text-indigo-400'
                                                    }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>
        </div>
      </aside>

      <div className="flex-1 min-w-0 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        {ADMIN_NAV.find(n => n.id === activeNavId)?.icon}
                        {ADMIN_NAV.find(n => n.id === activeNavId)?.label} Management
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                        <span>{filteredItems.length} Items found</span>
                        {activeFilter && (
                            <>
                                <span className="text-slate-600">•</span>
                                <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs border border-indigo-500/30 flex items-center gap-1">
                                    {activeFilter.value}
                                    <button onClick={() => setActiveFilter(null)} className="hover:text-white"><X className="w-3 h-3" /></button>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {view === 'list' ? (
                     <div className="flex items-center gap-3">
                         <div className="relative">
                             <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:ring-1 focus:ring-primary w-48 sm:w-64"
                             />
                             <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                         </div>
                        <button
                            onClick={handleCreate}
                            className="bg-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                     </div>
                ) : (
                    <button
                        onClick={handleCancel}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Cancel Edit
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-grow">
                        <p className="font-medium">Error</p>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-200 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
            )}
            {successMsg && (
                <div className="bg-green-500/10 border border-green-500/20 text-green-200 p-4 rounded-lg mb-6 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-grow">
                        <p className="font-medium">Success</p>
                        <p className="text-sm opacity-90">{successMsg}</p>
                    </div>
                    <button onClick={() => setSuccessMsg(null)} className="text-green-200 hover:text-white"><X className="w-4 h-4"/></button>
                </div>
            )}
             {apiKeyMissing && (
                <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 p-4 rounded-lg mb-6 text-sm flex items-start gap-3">
                     <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div><strong>Warning:</strong> No <code>API_KEY</code> found. AI Auto-Fill is disabled.</div>
                </div>
            )}

            {view === 'list' ? (
                <div className="bg-surface rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider font-medium">
                                <tr>
                                    <th className="px-6 py-4">Content</th>
                                    <th className="px-6 py-4">Details</th>
                                    <th className="px-6 py-4">Taxonomy</th>
                                    <th className="px-6 py-4">Links</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700">
                                {filteredItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-14 bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                                    <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{item.title}</div>
                                                    <div className="text-xs text-slate-500">ID: {item.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                             <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        item.type === ContentType.Movie ? 'bg-indigo-500/20 text-indigo-300' :
                                                        item.type === ContentType.Series ? 'bg-purple-500/20 text-purple-300' :
                                                        'bg-pink-500/20 text-pink-300'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                    {item.releaseYear && <span className="text-xs text-slate-500">{item.releaseYear}</span>}
                                                </div>
                                                {item.season && (
                                                    <div className="text-xs text-slate-400">S{item.season} • Ep{item.episode}</div>
                                                )}
                                             </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="space-y-1 text-xs">
                                                <div><span className="text-slate-500">Industry:</span> <span className="text-slate-300">{item.industry}</span></div>
                                                {item.language && <div><span className="text-slate-500">Lang:</span> <span className="text-slate-300">{item.language}</span></div>}
                                                {item.genres && item.genres.length > 0 && (
                                                    <div className="truncate max-w-[150px]" title={item.genres.join(', ')}>
                                                        <span className="text-slate-500">Genre:</span> <span className="text-slate-300">{item.genres.slice(0, 2).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                item.downloadLinks.length > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                            }`}>
                                                {item.downloadLinks.length} Links
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`/content/${item.id}`} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-400 hover:text-white hover:bg-blue-600 rounded-lg">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.title); }}
                                                    disabled={deletingId === item.id}
                                                    className="p-2 text-red-400 hover:text-white hover:bg-red-600 rounded-lg disabled:opacity-50"
                                                >
                                                    {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && !error && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Layers className="w-12 h-12 mb-3 opacity-20" />
                                                <p className="text-lg font-medium">No items found</p>
                                                <p className="text-sm">Try adjusting your filters or search query.</p>
                                                <button onClick={() => { setActiveFilter(null); setSearchQuery(''); }} className="mt-4 text-primary hover:underline text-sm">Clear Filters</button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <ContentForm 
                    initialData={editingItem}
                    onSuccess={handleSuccess} 
                    onCancel={handleCancel}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    hasKey={!apiKeyMissing}
                    setParentError={setError}
                />
            )}
        </div>
      </div>
    </div>
  );
};

interface ContentFormProps {
    initialData?: ContentItem | null;
    onSuccess: (msg: string) => void;
    onCancel: () => void;
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;
    hasKey: boolean;
    setParentError: (msg: string | null) => void;
}

const ContentForm: React.FC<ContentFormProps> = ({ 
    initialData, 
    onSuccess, 
    onCancel,
    isGenerating, 
    setIsGenerating, 
    hasKey, 
    setParentError 
}) => {
    const defaultValues = useMemo(() => {
        if (initialData) {
            return {
                ...initialData,
                genresString: initialData.genres?.join(', ') || ''
            };
        }
        return {
            title: '',
            type: ContentType.Movie,
            industry: Industry.Hollywood,
            downloadLinks: [{ quality: VideoQuality.Q1080p, url: '', size: '1GB' }],
            thumbnailUrl: '',
            description: '',
            releaseYear: new Date().getFullYear(),
            genresString: '',
            season: undefined,
            episode: undefined,
            language: undefined
        };
    }, [initialData]);

    const { register, control, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = useForm<ContentItem & { genresString: string }>({
        defaultValues: defaultValues as any
    });

    const { fields, append, remove } = useFieldArray({ control, name: "downloadLinks" });
    const watchType = watch("type");
    const watchIndustry = watch("industry");

    useEffect(() => {
        reset(defaultValues as any);
    }, [defaultValues, reset]);

    const handleAutoFill = async () => {
        const title = getValues("title");
        const type = getValues("type");
        if (!title) {
            setParentError("Please enter a title before using Auto-Fill.");
            return;
        }
        
        setIsGenerating(true);
        setParentError(null);
        try {
            const data = await GeminiService.generateContentDetails(title, type);
            setValue("description", data.description);
            setValue("industry", data.industry);
            setValue("releaseYear", data.releaseYear);
            if(data.suggestedLanguage && data.industry === Industry.SouthIndian) {
                setValue("language", data.suggestedLanguage);
            }
        } catch (e) {
            console.error(e);
            setParentError("Failed to generate content via AI. Please check your API key or connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = async (data: ContentItem & { genresString: string }) => {
        setParentError(null);
        try {
            const genres = data.genresString ? data.genresString.split(',').map(g => g.trim()).filter(g => g) : [];
            const processedLinks = data.downloadLinks.map(l => ({ 
                ...l, 
                id: l.id || Math.random().toString(36).substr(2, 9) 
            }));
            const { genresString, ...contentData } = data;
            const finalData = { ...contentData, genres, downloadLinks: processedLinks };

            if (initialData) {
                await ApiService.updateContent({
                    ...finalData,
                    id: initialData.id, 
                    createdAt: initialData.createdAt,
                    views: initialData.views
                });
                onSuccess("Content updated successfully");
            } else {
                await ApiService.addContent(finalData);
                onSuccess("Content added successfully");
            }
        } catch (err) {
            console.error(err);
            setParentError("Failed to save content. Please try again.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto bg-surface p-8 rounded-xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {initialData ? <Pencil className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-primary" />}
                    {initialData ? 'Edit Content' : 'Create New Content'}
                </h2>
                <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">
                    {initialData ? `ID: ${initialData.id}` : 'New Entry'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="col-span-2 flex gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Title <span className="text-red-500">*</span></label>
                        <input 
                            {...register("title", { required: "Title is required" })} 
                            className={`w-full bg-slate-900 border rounded-lg p-2.5 text-white focus:ring-1 focus:ring-primary focus:border-primary ${errors.title ? 'border-red-500' : 'border-slate-700'}`}
                            placeholder="e.g. Inception" 
                        />
                        {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title.message as string}</span>}
                    </div>
                    {hasKey && (
                        <button type="button" onClick={handleAutoFill} disabled={isGenerating} className="mb-0.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-4 py-2.5 rounded-lg border border-indigo-500/30 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                            Auto-Fill
                        </button>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                    <select {...register("type")} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                        {Object.values(ContentType).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Industry</label>
                    <select {...register("industry")} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                        {Object.values(Industry).map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </div>
                
                <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1">Genres (comma separated)</label>
                     <input {...register("genresString")} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="Action, Thriller, Drama..." />
                </div>

                {watchIndustry === Industry.SouthIndian && (
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Language</label>
                        <select {...register("language")} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white">
                            <option value="Telugu">Telugu</option>
                            <option value="Tamil">Tamil</option>
                            <option value="Malayalam">Malayalam</option>
                            <option value="Kannada">Kannada</option>
                        </select>
                    </div>
                )}

                <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Release Year</label>
                    <input type="number" {...register("releaseYear", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                </div>

                {watchType === ContentType.Series && (
                    <>
                        <div>
                             <label className="block text-sm font-medium text-slate-400 mb-1">Season</label>
                             <input type="number" {...register("season", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-400 mb-1">Episode</label>
                             <input type="number" {...register("episode", { valueAsNumber: true })} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" />
                        </div>
                    </>
                )}

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                    <textarea {...register("description")} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="Movie synopsis..." />
                </div>

                <div className="col-span-2">
                     <label className="block text-sm font-medium text-slate-400 mb-1">Thumbnail URL</label>
                     <input {...register("thumbnailUrl")} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white" placeholder="https://..." />
                </div>
            </div>

            <div className="border-t border-slate-700 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Download Links</h3>
                    <button type="button" onClick={() => append({ quality: VideoQuality.Q720p, url: '', size: '' } as any)} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Link
                    </button>
                </div>
                
                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                             <div className="w-full sm:w-28 flex-shrink-0">
                                <select {...register(`downloadLinks.${index}.quality` as const)} className="w-full bg-slate-800 border border-slate-700 rounded text-xs p-2 text-white">
                                    {Object.values(VideoQuality).map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                             </div>
                             <div className="flex-grow w-full">
                                <input {...register(`downloadLinks.${index}.url` as const, { required: true })} placeholder="Google Drive URL" className="w-full bg-slate-800 border border-slate-700 rounded text-xs p-2 text-white" />
                             </div>
                             <div className="w-full sm:w-24 flex-shrink-0">
                                <input {...register(`downloadLinks.${index}.size` as const)} placeholder="Size (e.g. 1GB)" className="w-full bg-slate-800 border border-slate-700 rounded text-xs p-2 text-white" />
                             </div>
                             <button type="button" onClick={() => remove(index)} className="p-2 text-slate-500 hover:text-red-400 self-end sm:self-auto">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-xs text-slate-500 italic text-center py-2">No download links added yet.</p>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 rounded-lg font-medium transition-all"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="bg-primary hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
                >
                    <Save className="w-5 h-5" /> 
                    {initialData ? 'Update Content' : 'Save Content'}
                </button>
            </div>
        </form>
    );
};
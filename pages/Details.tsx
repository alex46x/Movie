import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ContentItem, VideoQuality } from '../types';
import { ApiService } from '../services/api';
import { Download, ChevronLeft, Calendar, Film, Globe, HardDrive, Sparkles, Tag, AlertTriangle, RefreshCw, Bookmark, Check } from 'lucide-react';
import { getRecommendations } from '../utils/recommendationLogic';
import { ContentCard } from '../components/ContentCard';

export const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [recommendations, setRecommendations] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const loadContent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        
        // Parallel fetch for speed
        const [foundItem, allContent] = await Promise.all([
             ApiService.getContentById(id),
             ApiService.getAllContent()
        ]);
        
        setItem(foundItem || null);

        if (foundItem) {
          // Track view
          ApiService.incrementView(id);

          const watchlist = JSON.parse(localStorage.getItem('cine_watchlist') || '[]');
          setIsInWatchlist(watchlist.includes(foundItem.id));

          const similar = getRecommendations(foundItem, allContent);
          setRecommendations(similar);
        }
      } catch (err) {
        console.error("Failed to load details:", err);
        setError("Failed to load content details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadContent();
  }, [id]);

  const toggleWatchlist = () => {
      if (!item) return;
      
      const watchlist = JSON.parse(localStorage.getItem('cine_watchlist') || '[]');
      let newWatchlist: string[];

      if (watchlist.includes(item.id)) {
          newWatchlist = watchlist.filter((id: string) => id !== item.id);
          setIsInWatchlist(false);
      } else {
          newWatchlist = [...watchlist, item.id];
          setIsInWatchlist(true);
      }
      
      localStorage.setItem('cine_watchlist', JSON.stringify(newWatchlist));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-primary rounded-full border-t-transparent"></div></div>;

  if (error) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
            <div className="bg-red-500/10 p-4 rounded-full mb-4">
                <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <div className="flex gap-4">
                <button onClick={() => navigate(-1)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors">Go Back</button>
                <button 
                    onClick={loadContent} 
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                    <RefreshCw className="w-4 h-4" /> Try Again
                </button>
            </div>
        </div>
     );
  }

  if (!item) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-400"><p>Content not found.</p><Link to="/" className="text-primary mt-4 hover:underline">Go Home</Link></div>;

  const qualityColor = (q: VideoQuality) => {
    switch (q) {
      case VideoQuality.Q4K: return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      case VideoQuality.Q2K: return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
      case VideoQuality.Q1080p: return 'text-green-400 border-green-400/30 bg-green-400/10';
      default: return 'text-slate-400 border-slate-600 bg-slate-800';
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      <div 
        className="absolute inset-0 h-[60vh] bg-cover bg-center opacity-20 mask-image-gradient"
        style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
      />
      <div className="absolute inset-0 h-[60vh] bg-gradient-to-b from-transparent via-background/80 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <div className="flex-shrink-0 w-full md:w-80 lg:w-96 mx-auto md:mx-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative">
              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="flex-grow">
            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-semibold tracking-wider text-primary uppercase">
               <span className="bg-primary/20 px-2 py-1 rounded">{item.type}</span>
               <span className="bg-surface border border-slate-700 px-2 py-1 rounded">{item.industry}</span>
               {item.language && <span className="bg-surface border border-slate-700 px-2 py-1 rounded">{item.language}</span>}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">{item.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-slate-400 text-sm mb-6">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {item.releaseYear}</div>
              {item.season && <div className="flex items-center gap-2"><Film className="w-4 h-4" /> Season {item.season} • Ep {item.episode}</div>}
              <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {item.language || "English"}</div>
            </div>

            {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {item.genres.map(genre => (
                        <span key={genre} className="flex items-center gap-1 text-xs text-slate-300 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-full">
                            <Tag className="w-3 h-3 text-slate-500" /> {genre}
                        </span>
                    ))}
                </div>
            )}

            <div className="mb-8">
                <button
                    onClick={toggleWatchlist}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
                        isInWatchlist
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-500/20'
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                    }`}
                >
                    {isInWatchlist ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5 group-hover:scale-105 transition-transform" />}
                    {isInWatchlist ? 'In Your Watchlist' : 'Add to Watchlist'}
                </button>
            </div>

            <h2 className="text-xl font-semibold text-white mb-3">Synopsis</h2>
            <p className="text-slate-300 leading-relaxed mb-10 max-w-3xl">
              {item.description}
            </p>

            <div className="bg-surface/50 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-primary" />
                Download Links
                <span className="text-xs font-normal text-slate-500 ml-2">(Google Drive Secure)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.downloadLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-primary/50 hover:bg-slate-800 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-bold border ${qualityColor(link.quality)}`}>
                        {link.quality}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm text-slate-300 font-medium group-hover:text-white">Drive Download</span>
                         {link.size && <span className="text-xs text-slate-500">{link.size}</span>}
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
              {item.downloadLinks.length === 0 && (
                  <p className="text-slate-500 italic">No download links available yet.</p>
              )}
            </div>
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="mt-20 border-t border-slate-800 pt-12">
            <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-white">Similar Movies You May Like</h3>
            </div>
            
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map(rec => (
                    <div key={rec.id} className="h-full">
                        <ContentCard item={rec} />
                    </div>
                ))}
            </div>

            <div className="md:hidden flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory -mx-4 px-4 scrollbar-hide">
                {recommendations.map(rec => (
                    <div key={rec.id} className="w-40 flex-shrink-0 snap-start">
                        <ContentCard item={rec} />
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
}

export const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  // Format Genres for display (max 2)
  const displayGenre = item.genres && item.genres.length > 0 
    ? item.genres.slice(0, 2).join(', ') 
    : item.industry;

  return (
    <Link to={`/content/${item.id}`} className="group relative block overflow-hidden rounded-xl bg-surface hover:ring-2 hover:ring-primary transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col shadow-lg shadow-black/20">
      {/* Image Container with Aspect Ratio */}
      <div className="aspect-[2/3] w-full relative overflow-hidden bg-slate-900">
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
           <div className="bg-primary/90 text-white rounded-full p-4 shadow-lg backdrop-blur-sm transform scale-90 group-hover:scale-100 transition-transform">
             <Play className="w-6 h-6 fill-current" />
           </div>
        </div>

        {/* Quality Badge */}
        <div className="absolute top-2 right-2">
            {item.downloadLinks.some(l => l.quality === '4K' || l.quality === '2K') && (
                <span className="bg-yellow-500/90 text-black text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md">
                    4K
                </span>
            )}
            {!item.downloadLinks.some(l => l.quality === '4K' || l.quality === '2K') && item.downloadLinks.some(l => l.quality === '1080p') && (
                 <span className="bg-primary/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm backdrop-blur-md">
                 FHD
             </span>
            )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4 relative flex-grow flex flex-col justify-end">
        <h3 className="text-white font-bold leading-tight truncate group-hover:text-primary transition-colors mb-1.5" title={item.title}>
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 rounded uppercase text-[10px] font-medium tracking-wide text-slate-300">
                {item.type}
            </span>
            <div className="flex items-center gap-1.5 opacity-80">
                <Calendar className="w-3 h-3" />
                <span>{item.releaseYear}</span>
            </div>
        </div>

        <div className="text-[11px] text-slate-500 truncate border-t border-slate-700/50 pt-2 flex items-center gap-1.5">
             {item.language && (
                 <>
                    <span className="text-slate-400 font-medium">{item.language}</span>
                    <span className="w-0.5 h-0.5 bg-slate-600 rounded-full"></span>
                 </>
             )}
             <span>{displayGenre}</span>
        </div>
      </div>
    </Link>
  );
};
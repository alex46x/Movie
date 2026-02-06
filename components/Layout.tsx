import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, ShieldCheck, Menu, X, ChevronDown, ChevronRight, Home, Clock, Grid, Search, PlayCircle, Star, Tv } from 'lucide-react';
import { SmartSearch } from './SmartSearch';

interface LayoutProps {
  children: React.ReactNode;
}

// Navigation Data Structure
const NAV_DATA = {
  Movies: {
    icon: <Film className="w-4 h-4" />,
    description: "Latest blockbusters and classics",
    sections: [
      { title: "Languages", items: ["Hindi", "English", "Bangla", "Dual Audio"] },
      { title: "Indian", items: ["Tamil", "Telugu", "Malayalam", "Kannada", "Hindi (Bollywood)"] },
      { title: "International", items: ["Hollywood", "Korean", "Japanese", "Chinese"] },
      { title: "Genres", items: ["Action", "Thriller", "Horror", "Comedy", "Romance", "Sci-Fi", "Fantasy", "Crime", "Adventure", "Animation"] },
    ]
  },
  "Web Series": {
    icon: <PlayCircle className="w-4 h-4" />,
    description: "Binge-worthy series from all platforms",
    sections: [
      { title: "Languages", items: ["Hindi", "English", "Korean"] },
      { title: "Indian Regional", items: ["Tamil", "Telugu", "Malayalam"] },
      { title: "Platforms", items: ["Netflix", "Amazon Prime", "Disney+", "Others"] },
      { 
        title: "Trending", 
        items: [],
        customContent: (
            <div className="space-y-3">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Featured Series</div>
                <div className="group/series cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                    <div className="text-slate-200 group-hover/series:text-indigo-400 text-sm font-medium flex items-center justify-between">
                        Stranger Things <ChevronRight className="w-3 h-3 opacity-50" />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Season 4 • Netflix</div>
                </div>
                 <div className="group/series cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                    <div className="text-slate-200 group-hover/series:text-indigo-400 text-sm font-medium flex items-center justify-between">
                        Mirzapur <ChevronRight className="w-3 h-3 opacity-50" />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Season 3 • Prime</div>
                </div>
            </div>
        )
      }
    ]
  },
  "Anime / Cartoon": {
    icon: <Star className="w-4 h-4" />,
    description: "Japanese animation and kids content",
    sections: [
      { title: "Anime", items: ["Japanese", "Korean", "Chinese"] },
      { title: "Cartoon", items: ["English", "Hindi Dub", "Kids"] },
      { 
        title: "Popular", 
        items: [],
        customContent: (
             <div className="space-y-3">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Top Rated</div>
                <div className="text-sm text-slate-300 hover:text-indigo-400 cursor-pointer py-1">Naruto Shippuden</div>
                <div className="text-sm text-slate-300 hover:text-indigo-400 cursor-pointer py-1">One Piece</div>
                <div className="text-sm text-slate-300 hover:text-indigo-400 cursor-pointer py-1">Demon Slayer</div>
                <div className="text-[10px] text-green-400 mt-2 bg-green-900/20 inline-block px-2 py-1 rounded border border-green-900/50">Batch Download Available</div>
            </div>
        )
      }
    ]
  },
  "TV Shows": {
    icon: <Tv className="w-4 h-4" />,
    description: "Reality shows and daily soaps",
    sections: [
      { title: "Indian", items: ["Drama", "Reality", "Comedy"] },
      { title: "International", items: ["American", "Korean", "British"] },
       { 
        title: "Quick Access", 
        items: [],
        customContent: (
             <div className="space-y-3">
                <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2">Live Now</div>
                <div className="flex items-center gap-2 text-sm text-slate-300 hover:text-indigo-400 cursor-pointer py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Bigg Boss 17
                </div>
                <div className="text-sm text-slate-300 hover:text-indigo-400 cursor-pointer py-1">Shark Tank</div>
            </div>
        )
      }
    ]
  }
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Movies");
  const [mobileExpandedCategory, setMobileExpandedCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  
  // Use ReturnType<typeof setTimeout> to handle both Node and Browser environments
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsMegaMenuOpen(false);
  }, [location.pathname, location.search]); // Trigger close on search params change too

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
        setIsMegaMenuOpen(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-slate-100 selection:bg-indigo-500/30 selection:text-white">
      
      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b ${
            isScrolled 
                ? 'bg-[#0f172a]/95 backdrop-blur-xl border-white/5 h-16 shadow-2xl shadow-black/50' 
                : 'bg-gradient-to-b from-[#0f172a] via-[#0f172a]/80 to-transparent border-transparent h-20'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-6">
            
            {/* Left: Logo */}
            <Link to="/" className="flex items-center gap-3 z-50 flex-shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
                <Film className="h-5 w-5 fill-current" />
              </div>
              <span className={`text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 transition-opacity ${isSearchOpen ? 'hidden sm:block' : 'block'}`}>
                CineStream
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center h-full gap-1">
                <Link to="/" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors relative group overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2"><Home className="w-4 h-4" /> Home</span>
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>

                {/* Mega Menu Trigger */}
                <div 
                    className="h-full flex items-center"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 relative group ${isMegaMenuOpen ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                        <Grid className="w-4 h-4" /> Content <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isMegaMenuOpen ? 'rotate-180 text-indigo-400' : ''}`} />
                        <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transition-transform duration-300 origin-left ${isMegaMenuOpen ? 'scale-x-100' : 'scale-x-0'}`}></span>
                    </button>
                    
                    {/* Mega Menu Overlay */}
                    <div 
                        className={`absolute top-full left-0 w-full bg-[#0f172a] border-t border-white/5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] transition-all duration-300 origin-top transform ${
                            isMegaMenuOpen 
                                ? 'opacity-100 visible translate-y-0' 
                                : 'opacity-0 invisible -translate-y-2 pointer-events-none'
                        }`}
                    >
                       <div className="max-w-7xl mx-auto flex min-h-[450px]">
                           {/* Side Tabs */}
                           <div className="w-64 bg-slate-900/50 border-r border-white/5 py-8">
                               {Object.keys(NAV_DATA).map((category) => {
                                   const data = (NAV_DATA as any)[category];
                                   return (
                                       <button
                                         key={category}
                                         onMouseEnter={() => setActiveTab(category)}
                                         className={`w-full text-left px-8 py-4 flex items-start gap-4 transition-all duration-200 border-l-2 ${
                                             activeTab === category 
                                             ? 'bg-white/5 border-indigo-500' 
                                             : 'border-transparent hover:bg-white/[0.02]'
                                         }`}
                                       >
                                         <div className={`${activeTab === category ? 'text-indigo-400' : 'text-slate-500'}`}>
                                             {data.icon}
                                         </div>
                                         <div>
                                            <div className={`text-sm font-medium ${activeTab === category ? 'text-white' : 'text-slate-400'}`}>
                                                {category}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5 leading-tight opacity-70">
                                                {data.description}
                                            </div>
                                         </div>
                                       </button>
                                   );
                               })}
                           </div>

                           {/* Tab Content */}
                           <div className="flex-1 p-10 bg-gradient-to-br from-slate-900/30 to-black/20">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                                    <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                        {(NAV_DATA as any)[activeTab].icon}
                                    </span>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">{activeTab}</h2>
                                    <Link 
                                        to={`/browse?category=${encodeURIComponent(activeTab)}`}
                                        className="ml-auto text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/link"
                                    >
                                        View All <ChevronRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                                    </Link>
                                </div>

                                <div className="grid grid-cols-4 gap-x-12 gap-y-8">
                                    {(NAV_DATA as any)[activeTab].sections.map((section: any, idx: number) => (
                                        <div key={idx} className="space-y-4">
                                            {section.title && (
                                                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    {section.title}
                                                </h3>
                                            )}
                                            {section.customContent ? (
                                                section.customContent
                                            ) : (
                                                <ul className="space-y-2">
                                                    {section.items.map((item: string) => (
                                                        <li key={item}>
                                                            <Link 
                                                                to={`/browse?category=${encodeURIComponent(activeTab)}&filter=${encodeURIComponent(item)}`}
                                                                className="text-sm text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 block py-0.5 border-l border-transparent hover:border-indigo-500/50 hover:pl-2"
                                                            >
                                                                {item}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </div>
                           </div>
                       </div>
                    </div>
                </div>

                <Link to="/?sort=latest" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors relative group">
                    <span className="relative z-10 flex items-center gap-2"><Clock className="w-4 h-4" /> Latest</span>
                     <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </Link>
            </div>

            {/* Smart Search Desktop */}
            <div className="hidden lg:block flex-1 max-w-lg mx-8 transition-all duration-300 focus-within:max-w-2xl">
               <SmartSearch />
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
                 <Link 
                    to="/admin" 
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 border border-slate-700/50 rounded-lg hover:border-indigo-500/50 hover:bg-indigo-500/5"
                 >
                    <ShieldCheck className="w-4 h-4" /> Admin Panel
                </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex lg:hidden items-center gap-4">
               {!isSearchOpen && (
                   <button 
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                   >
                      <Search className="w-5 h-5" />
                   </button>
               )}
               <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
               >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
            </div>
          </div>
        </div>

        {/* Global Search Bar Overlay (Mobile) */}
        {isSearchOpen && (
            <div className="lg:hidden absolute top-0 left-0 w-full h-full bg-[#0f172a] flex items-center px-4 animate-in slide-in-from-top-2 duration-200 z-50 border-b border-white/10">
                <SmartSearch 
                    autoFocus 
                    onClose={() => setIsSearchOpen(false)} 
                    placeholder="Search titles..." 
                />
            </div>
        )}

        {/* Mobile Menu (Accordion Style) */}
        <div 
            className={`lg:hidden fixed inset-x-0 top-16 sm:top-20 bottom-0 bg-[#0f172a] overflow-y-auto transition-transform duration-300 ease-in-out ${
                isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
        >
            <div className="p-4 space-y-2 pb-20">
                <Link 
                    to="/" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                    <Home className="w-5 h-5 text-indigo-500" /> Home
                </Link>
                
                {/* Content Accordion */}
                <div className="rounded-xl overflow-hidden bg-slate-900/50 border border-white/5">
                    <div className="px-4 py-3 text-white font-medium flex items-center gap-2 border-b border-white/5 bg-slate-800/50">
                        <Grid className="w-4 h-4 text-indigo-400" /> Browse Content
                    </div>
                    <div>
                        {Object.keys(NAV_DATA).map((category) => (
                            <div key={category} className="border-b border-white/5 last:border-0">
                                <button 
                                    onClick={() => setMobileExpandedCategory(mobileExpandedCategory === category ? null : category)}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 text-sm transition-colors ${
                                        mobileExpandedCategory === category ? 'text-indigo-400 bg-white/[0.02]' : 'text-slate-300 hover:text-white'
                                    }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="opacity-70">{(NAV_DATA as any)[category].icon}</span>
                                        {category}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${mobileExpandedCategory === category ? 'rotate-180 text-indigo-400' : ''}`} />
                                </button>
                                
                                {/* Nested Items */}
                                <div 
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        mobileExpandedCategory === category ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="bg-black/20 px-5 py-4 space-y-6">
                                        {(NAV_DATA as any)[category].sections.map((section: any, idx: number) => (
                                            <div key={idx} className="space-y-2">
                                                 {section.title && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{section.title}</div>}
                                                 {section.customContent ? section.customContent : (
                                                     <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                                         {section.items.map((item: string) => (
                                                             <Link 
                                                                key={item} 
                                                                to={`/browse?category=${encodeURIComponent(category)}&filter=${encodeURIComponent(item)}`}
                                                                onClick={() => setIsMobileMenuOpen(false)}
                                                                className="text-sm text-slate-400 hover:text-white py-1.5 block truncate"
                                                             >
                                                                 {item}
                                                             </Link>
                                                         ))}
                                                     </div>
                                                 )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Link 
                    to="/?sort=latest" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                    <Clock className="w-5 h-5 text-indigo-500" /> Latest Uploads
                </Link>
                 <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-4 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white font-medium transition-colors"
                >
                    <ShieldCheck className="w-5 h-5 text-indigo-500" /> Admin Dashboard
                </Link>
            </div>
        </div>
      </nav>

      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-[#0f172a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    <Film className="h-4 w-4 text-indigo-400" />
                 </div>
                 <span className="text-lg font-bold text-slate-300 tracking-tight">CineStream</span>
              </div>
              
              <div className="flex gap-8 text-sm text-slate-500 font-medium">
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">Terms of Service</span>
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">Privacy Policy</span>
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">DMCA</span>
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">Contact</span>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/5 text-center md:text-left flex flex-col md:flex-row justify-between text-xs text-slate-600">
                <p>&copy; {new Date().getFullYear()} CineStream Hub. All rights reserved.</p>
                <p className="mt-2 md:mt-0">Designed for modern streaming experiences.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};
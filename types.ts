export enum ContentType {
  Movie = 'Movie',
  Series = 'Series',
  Cartoon = 'Cartoon'
}

export enum Industry {
  Hollywood = 'Hollywood',
  Bollywood = 'Bollywood',
  SouthIndian = 'South Indian',
  Anime = 'Anime',
  Other = 'Other'
}

export enum VideoQuality {
  Q480p = '480p',
  Q720p = '720p',
  Q1080p = '1080p',
  Q2K = '2K',
  Q4K = '4K'
}

export interface DownloadLink {
  id: string;
  quality: VideoQuality;
  url: string; // Google Drive Link
  size?: string;
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  industry: Industry;
  genres?: string[]; // Added for similarity matching
  language?: string; // Required if Industry is SouthIndian
  description: string;
  thumbnailUrl: string;
  downloadLinks: DownloadLink[];
  season?: number; // Only for Series
  episode?: number; // Only for Series
  releaseYear?: number;
  views?: number; // Added for popularity sorting
  createdAt: number;
}

export interface ContentFilter {
  type?: ContentType;
  industry?: Industry;
  searchQuery?: string;
}
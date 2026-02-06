import { ContentItem, ContentType, Industry } from "../types";

// --- KNOWLEDGE BASE ---
const KEYWORD_MAP = {
  types: {
    'movie': ContentType.Movie,
    'movies': ContentType.Movie,
    'film': ContentType.Movie,
    'films': ContentType.Movie,
    'series': ContentType.Series,
    'web series': ContentType.Series,
    'show': ContentType.Series,
    'shows': ContentType.Series,
    'tv': ContentType.Series,
    'cartoon': ContentType.Cartoon,
    'cartoons': ContentType.Cartoon,
    'anime': ContentType.Cartoon,
    'animation': ContentType.Cartoon,
  },
  genres: [
    'action', 'adventure', 'sci-fi', 'scifi', 'science fiction', 
    'horror', 'thriller', 'comedy', 'romance', 'drama', 
    'fantasy', 'crime', 'mystery', 'animation', 'biography', 
    'history', 'war', 'sports', 'musical', 'family'
  ],
  languages: [
    'hindi', 'english', 'tamil', 'telugu', 'malayalam', 
    'kannada', 'bengali', 'bangla', 'korean', 'japanese', 
    'chinese', 'spanish', 'french', 'dual audio'
  ],
  industries: {
    'hollywood': Industry.Hollywood,
    'bollywood': Industry.Bollywood,
    'tollywood': Industry.SouthIndian,
    'kollywood': Industry.SouthIndian,
    'south': Industry.SouthIndian,
    'south indian': Industry.SouthIndian,
  }
};

export interface SearchIntent {
  types: ContentType[];
  genres: string[];
  languages: string[];
  industries: Industry[];
  text: string; // Remaining text after extraction
  originalKeywords: string[]; // List of keywords found for UI tags
}

// Calculate Levenshtein Distance
const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
};

const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
const removeRepeats = (str: string) => str.replace(/(.)\1+/g, '$1');

// --- INTENT PARSER ---
export const parseSearchQuery = (query: string): SearchIntent => {
  let remainingText = query.toLowerCase();
  const intent: SearchIntent = {
    types: [],
    genres: [],
    languages: [],
    industries: [],
    text: '',
    originalKeywords: []
  };

  // Helper to extract and remove keyword from text
  const extract = (word: string): boolean => {
    // Regex matches whole word boundaries to avoid partial matches (e.g. "act" in "action")
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(remainingText)) {
      remainingText = remainingText.replace(regex, ' ').replace(/\s+/g, ' ').trim();
      intent.originalKeywords.push(word);
      return true;
    }
    return false;
  };

  // 1. Detect Content Types
  Object.entries(KEYWORD_MAP.types).forEach(([key, value]) => {
    if (extract(key)) {
      if (!intent.types.includes(value)) intent.types.push(value);
    }
  });

  // 2. Detect Industries
  Object.entries(KEYWORD_MAP.industries).forEach(([key, value]) => {
    if (extract(key)) {
      if (!intent.industries.includes(value)) intent.industries.push(value);
    }
  });

  // 3. Detect Languages
  KEYWORD_MAP.languages.forEach(lang => {
    if (extract(lang)) intent.languages.push(lang);
  });

  // 4. Detect Genres
  // We handle multi-word genres (Science Fiction) first if we had them, currently mostly single word
  KEYWORD_MAP.genres.forEach(genre => {
    // Handle "sci-fi" variations
    if (genre === 'scifi' || genre === 'science fiction') {
       if (extract(genre)) {
           if (!intent.genres.includes('Sci-Fi')) intent.genres.push('Sci-Fi');
       }
    } else if (extract(genre)) {
       // Capitalize first letter for consistency with data
       const formatted = genre.charAt(0).toUpperCase() + genre.slice(1);
       if (!intent.genres.includes(formatted)) intent.genres.push(formatted);
    }
  });

  intent.text = remainingText;
  return intent;
};

export interface SearchResult {
  item: ContentItem;
  score: number;
  matchType: 'exact' | 'prefix' | 'word-start' | 'partial' | 'fuzzy' | 'intent';
}

export const searchContent = (items: ContentItem[], query: string): SearchResult[] => {
  if (!query) return [];

  const parsed = parseSearchQuery(query);
  const normalizedQueryText = normalize(parsed.text);
  const hasIntent = parsed.types.length > 0 || parsed.genres.length > 0 || parsed.languages.length > 0 || parsed.industries.length > 0;

  const results: SearchResult[] = [];

  items.forEach((item) => {
    let score = 0;
    let matchType: SearchResult['matchType'] = 'fuzzy';
    let isFilteredOut = false;

    // --- 1. FILTERING (Negative Scoring) ---
    
    // Type Mismatch
    if (parsed.types.length > 0 && !parsed.types.includes(item.type)) {
        isFilteredOut = true;
    }

    // Genre Mismatch (Must match at least one if genres searched)
    if (parsed.genres.length > 0) {
        const itemGenres = (item.genres || []).map(g => g.toLowerCase());
        const hasGenre = parsed.genres.some(g => {
            // Special handling for Sci-Fi variation
            const gLower = g.toLowerCase();
            return itemGenres.some(ig => ig === gLower || (gLower.includes('sci') && ig.includes('sci')));
        });
        if (!hasGenre) isFilteredOut = true;
    }

    // Language/Industry Mismatch
    if (parsed.languages.length > 0) {
        const itemLang = (item.language || '').toLowerCase();
        // If item has no language (e.g. Hollywood movie implied English), we might need loose check
        // For now, strict check if language field exists
        if (item.language && !parsed.languages.includes(itemLang)) {
            // Also check if the "Language" matches the industry (e.g. Anime implies Japanese)
            const isAnimeJapanese = item.industry === Industry.Anime && parsed.languages.includes('japanese');
            const isHollywoodEnglish = item.industry === Industry.Hollywood && parsed.languages.includes('english');
            
            if (!isAnimeJapanese && !isHollywoodEnglish) isFilteredOut = true;
        }
    }

    if (parsed.industries.length > 0 && !parsed.industries.includes(item.industry)) {
        isFilteredOut = true;
    }

    if (isFilteredOut) return; // Skip this item completely

    // --- 2. SCORING ---

    // Base score for passing filter criteria
    if (hasIntent) {
        score += 200; 
        matchType = 'intent';
    }

    // Text Matching (on remaining text)
    if (parsed.text.length > 0) {
        const normTitle = normalize(item.title);
        
        // Exact Match
        if (normTitle === normalizedQueryText) {
            score += 3000;
            matchType = 'exact';
        }
        // Prefix Match
        else if (normTitle.startsWith(normalizedQueryText)) {
            score += 2000;
            matchType = normalizedQueryText.length > 1 ? 'prefix' : 'fuzzy';
        }
        // Word Boundary Match (e.g. query "Knight" matches "The Dark Knight")
        else if (normTitle.includes(` ${normalizedQueryText}`)) {
            score += 1500;
            matchType = 'word-start';
        }
        // Partial Inclusion
        else if (normTitle.includes(normalizedQueryText)) {
            score += 500;
            matchType = 'partial';
        }
        // Fuzzy
        else {
            const cleanQuery = removeRepeats(normalizedQueryText);
            const cleanTitle = removeRepeats(normTitle);
            const dist = levenshteinDistance(cleanQuery, cleanTitle);
            const maxLen = Math.max(cleanQuery.length, cleanTitle.length);
            const similarity = 1 - (dist / maxLen);

            if (similarity > 0.7) {
                score += 200 * similarity;
                matchType = 'fuzzy';
            }
        }
    } else {
        // Query was ONLY intent (e.g. "Horror Movies")
        // Boost by popularity/recency to make list useful
        score += (item.views || 0) / 1000; // Tiny boost for views
        if (item.releaseYear) score += (item.releaseYear - 2000); // Slight boost for newer
    }

    if (score > 0) {
      results.push({ item, score, matchType });
    }
  });

  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
};

export const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts;
};
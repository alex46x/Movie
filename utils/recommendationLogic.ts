import { ContentItem } from "../types";

export const getRecommendations = (currentItem: ContentItem, allItems: ContentItem[]): ContentItem[] => {
  // 1. Filter by same Type (Movie -> Movie, Series -> Series) and exclude current item
  let candidates = allItems.filter(
    (item) => item.type === currentItem.type && item.id !== currentItem.id
  );

  // 2. Calculate Similarity Score
  const scoredCandidates = candidates.map((item) => {
    let score = 0;

    // A. Genre Match (Priority 1: High weight)
    const currentGenres = currentItem.genres || [];
    const itemGenres = item.genres || [];
    // Count how many genres match
    const sharedGenres = currentGenres.filter((g) => itemGenres.includes(g));
    score += sharedGenres.length * 5;

    // B. Language Match (Priority 2: Medium weight)
    // Especially important for regional content (Telugu, Tamil, etc.)
    if (currentItem.language && item.language && currentItem.language === item.language) {
      score += 4;
    }

    // C. Industry Match (Priority 3: Medium weight)
    if (currentItem.industry === item.industry) {
      score += 3;
    }

    // D. Title Keyword Similarity (Priority 5: Low weight)
    // Simple check for shared meaningful words
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    const currentKeywords = normalize(currentItem.title).split(' ').filter(w => w.length > 3);
    const itemKeywords = normalize(item.title).split(' ').filter(w => w.length > 3);
    
    const sharedKeywords = currentKeywords.filter(w => itemKeywords.includes(w));
    score += sharedKeywords.length * 2;

    return { item, score };
  });

  // 3. Sort by Score (Desc)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // 4. Filter Strategy
  // If we have items with good scores (>0), prefer those.
  let recommendations = scoredCandidates
      .filter(x => x.score > 0)
      .map(x => x.item);
  
  // 5. Fallback Strategy
  // If fewer than 4 matched recommendations, fill matching Type sorted by Year (Newest first)
  if (recommendations.length < 4) {
      const existingIds = new Set(recommendations.map(r => r.id));
      const remaining = candidates
        .filter(c => !existingIds.has(c.id))
        .sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0)); // Sort by newest
      
      recommendations = [...recommendations, ...remaining];
  }

  // Return top 8 results
  return recommendations.slice(0, 8);
};

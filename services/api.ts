import { ContentItem } from '../types';
import { MockDB } from './mockDb';

const API_BASE_URL = 'http://localhost:5000/api';

// Helper to try API first, then fallback to MockDB if network fails
async function withFallback<T>(
    apiCall: () => Promise<T>, 
    fallbackCall: () => Promise<T>
): Promise<T> {
    try {
        return await apiCall();
    } catch (error) {
        console.warn("Backend API unreachable, falling back to local storage.", error);
        return fallbackCall();
    }
}

export const ApiService = {
  getAllContent: async (): Promise<ContentItem[]> => {
    return withFallback(
        async () => {
            const response = await fetch(`${API_BASE_URL}/contents`);
            if (!response.ok) throw new Error('Failed to fetch content');
            return await response.json();
        },
        () => MockDB.getAllContent()
    );
  },

  getContentById: async (id: string): Promise<ContentItem | undefined> => {
    return withFallback(
        async () => {
            const response = await fetch(`${API_BASE_URL}/contents/${id}`);
            if (response.status === 404) return undefined;
            if (!response.ok) throw new Error('Failed to fetch content');
            return await response.json();
        },
        () => MockDB.getContentById(id)
    );
  },

  addContent: async (item: Omit<ContentItem, 'id' | 'createdAt'>): Promise<ContentItem> => {
    return withFallback(
        async () => {
            const response = await fetch(`${API_BASE_URL}/contents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (!response.ok) throw new Error('Failed to create content');
            return await response.json();
        },
        () => MockDB.addContent(item)
    );
  },

  updateContent: async (item: ContentItem): Promise<ContentItem> => {
    return withFallback(
        async () => {
            const response = await fetch(`${API_BASE_URL}/contents/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (!response.ok) throw new Error('Failed to update content');
            return await response.json();
        },
        () => MockDB.updateContent(item)
    );
  },

  deleteContent: async (id: string): Promise<void> => {
    return withFallback(
        async () => {
            const response = await fetch(`${API_BASE_URL}/contents/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete content');
        },
        () => MockDB.deleteContent(id)
    );
  },

  incrementView: async (id: string): Promise<void> => {
      try {
          // Try API
          const response = await fetch(`${API_BASE_URL}/contents/${id}/view`, { method: 'POST' });
          if (!response.ok) throw new Error("API View Increment Failed");
      } catch (e) {
          // Fallback: manually update view count in local storage
          try {
             const item = await MockDB.getContentById(id);
             if (item) {
                 await MockDB.updateContent({ ...item, views: (item.views || 0) + 1 });
             }
          } catch (fallbackError) {
              console.error("Failed to increment view in fallback", fallbackError);
          }
      }
  }
};
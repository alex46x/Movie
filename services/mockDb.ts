import { ContentItem, ContentType, Industry, VideoQuality } from '../types';

// Start with empty data as requested to ensure no hardcoded items persist.
// The app will rely entirely on data created via the Admin Panel.
const INITIAL_DATA: ContentItem[] = [];

// Simulating database latency
const DELAY = 300;

export const MockDB = {
  getAllContent: async (): Promise<ContentItem[]> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const stored = localStorage.getItem('cine_db');
          if (stored) {
             try {
                resolve(JSON.parse(stored));
             } catch (parseError) {
                console.error("Database corruption detected:", parseError);
                reject(new Error("Local database is corrupt. Please clear site data or reset."));
             }
          } else {
             resolve(INITIAL_DATA);
          }
        } catch (e) {
          console.error("Failed to access database", e);
          reject(new Error("Unable to access local storage. Please check browser permissions."));
        }
      }, DELAY);
    });
  },

  getContentById: async (id: string): Promise<ContentItem | undefined> => {
    try {
        const all = await MockDB.getAllContent();
        return all.find(item => item.id === id);
    } catch (e) {
        throw e;
    }
  },

  addContent: async (item: Omit<ContentItem, 'id' | 'createdAt'>): Promise<ContentItem> => {
    const all = await MockDB.getAllContent();
    const newItem: ContentItem = {
      ...item,
      // Use crypto.randomUUID if available, else fallback to Date + Random for uniqueness
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      views: 0
    };
    const updated = [newItem, ...all];
    localStorage.setItem('cine_db', JSON.stringify(updated));
    return newItem;
  },

  updateContent: async (item: ContentItem): Promise<ContentItem> => {
    const all = await MockDB.getAllContent();
    const index = all.findIndex(i => i.id === item.id);
    
    if (index === -1) {
        throw new Error("Content not found to update");
    }

    const updatedList = [...all];
    updatedList[index] = { ...updatedList[index], ...item };
    
    localStorage.setItem('cine_db', JSON.stringify(updatedList));
    return updatedList[index];
  },

  deleteContent: async (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const stored = localStorage.getItem('cine_db');
                let allItems: ContentItem[] = [];
                if (stored) {
                    allItems = JSON.parse(stored);
                } else {
                    allItems = INITIAL_DATA;
                }

                const updated = allItems.filter(item => item.id !== id);
                localStorage.setItem('cine_db', JSON.stringify(updated));
                resolve();
            } catch (e) {
                console.error("Failed to delete content:", e);
                reject(e);
            }
        }, DELAY);
    });
  },
  
  // Helper to reset if needed
  reset: () => {
    localStorage.removeItem('cine_db');
    window.location.reload();
  }
};
# Favorites System - How It Works

## Overview
The wedding app uses a simple, local storage-based favorites system that works the same way for both vendors and articles.

## Architecture

### Data Storage
```
SHARED DATA (In App Code):
├── Vendors (all users see same vendors)
└── Articles (all users see same articles)

USER'S PERSONAL DATA (localStorage):
├── wedding-favorites: ["vendor1", "vendor5"]
└── wedding-article-favorites: ["article1", "article3"]
```

### Store Structure (Zustand)
```typescript
interface WeddingState {
  // Shared data
  vendors: Vendor[];
  
  // User's personal favorites (just IDs)
  favoriteVendors: string[];
  favoriteArticles: string[];
  
  // Actions
  toggleFavoriteVendor: (vendorId: string) => Promise<Result>;
  toggleFavoriteArticle: (articleId: string) => Promise<Result>;
}
```

## How It Works

### 1. User Favorites a Vendor
```typescript
// User taps heart on Vendor #5
toggleFavoriteVendor("vendor5")

// Store checks current favorites
currentFavorites = ["vendor1", "vendor3"]

// Adds new favorite
newFavorites = ["vendor1", "vendor3", "vendor5"]

// Saves to localStorage
localStorage.setItem('wedding-favorites', '["vendor1","vendor3","vendor5"]')

// Updates UI immediately
set({ favoriteVendors: newFavorites })
```

### 2. User Favorites an Article
```typescript
// User taps heart on Article #2
toggleFavoriteArticle("article2")

// Store checks current favorites
currentFavorites = ["article1"]

// Adds new favorite
newFavorites = ["article1", "article2"]

// Saves to localStorage
localStorage.setItem('wedding-article-favorites', '["article1","article2"]')

// Updates UI immediately
set({ favoriteArticles: newFavorites })
```

### 3. Displaying Favorites
```typescript
// In Favorites Page
const { vendors, favoriteVendors, favoriteArticles } = useWeddingStore();

// Filter vendors to show only favorites
const favoriteVendorsList = vendors.filter(v => 
  favoriteVendors.includes(v.id)
);

// Filter articles to show only favorites
const favoriteArticlesList = ARTICLES.filter(a => 
  favoriteArticles.includes(a.id)
);
```

## Key Points

✅ **Articles are shared** - Everyone sees the same articles
✅ **Favorites are personal** - Each user has their own list
✅ **Stored locally** - Uses localStorage (can upgrade to database later)
✅ **Same pattern** - Vendors and articles work identically
✅ **Simple & fast** - No backend calls needed for favorites

## Storage Keys

- `wedding-favorites` - Vendor favorite IDs
- `wedding-article-favorites` - Article favorite IDs

## Example localStorage Data

```json
{
  "wedding-favorites": ["vendor-1", "vendor-5", "vendor-12"],
  "wedding-article-favorites": ["1", "3", "4"]
}
```

## Future Enhancements

When you add user authentication and a backend:

1. **Sync to Database**
   ```sql
   CREATE TABLE user_favorites (
     user_id UUID,
     vendor_id TEXT,
     article_id TEXT,
     created_at TIMESTAMP
   );
   ```

2. **Multi-Device Sync**
   - Favorites sync across user's devices
   - Stored in Supabase instead of localStorage

3. **Social Features** (Optional)
   - See what articles are most favorited
   - Share favorite collections with partner

But for now, the local storage approach works perfectly! 🎯

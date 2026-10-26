# Wedding Inspiration View All - Design Document

## Overview

This design enhances the existing wedding inspiration system by adding comprehensive "View All" functionality, detailed article pages, and improved navigation. The solution builds upon the current article listing structure while adding new screens and enhanced user experience features.

## Architecture

### Screen Structure
```
Inspiration Main Page (existing)
├── View All Articles Page (new)
│   ├── Category-filtered article lists
│   ├── Search functionality
│   └── Enhanced navigation
└── Article Detail Page (new)
    ├── Full article content
    ├── Navigation between articles
    ├── Related articles
    └── Enhanced interactions
```

### Navigation Flow
```
Home → Inspiration → View All → Article Detail
                 ↓              ↑
            Direct Article Access
```

## Components and Interfaces

### 1. Enhanced Inspiration Main Page
**File:** `app/inspiration.tsx` (existing, to be enhanced)

**Enhancements:**
- Add "View All" button for each category
- Add search bar at the top
- Show article count per category
- Add recently viewed articles section

**New Props Interface:**
```typescript
interface InspirationScreenProps {
  initialCategory?: string;
  showViewAll?: boolean;
}
```

### 2. View All Articles Page
**File:** `app/inspiration/view-all.tsx` (new)

**Features:**
- Display all articles in selected category
- Maintain category filtering
- Search functionality
- Pagination or infinite scroll
- Sort options (newest, popular, trending)

**Component Interface:**
```typescript
interface ViewAllArticlesProps {
  category?: string;
  searchQuery?: string;
}

interface ViewAllArticlesState {
  articles: Article[];
  loading: boolean;
  searchQuery: string;
  sortBy: 'newest' | 'popular' | 'trending';
}
```

### 3. Article Detail Page
**File:** `app/inspiration/[articleId].tsx` (new)

**Features:**
- Full article content with rich formatting
- Article metadata (author, date, tags, read time)
- Previous/Next navigation within category
- Related articles section
- Enhanced sharing options
- Reading progress indicator
- Bookmark functionality

**Component Interface:**
```typescript
interface ArticleDetailProps {
  articleId: string;
  category?: string;
}

interface ArticleDetailState {
  article: Article | null;
  relatedArticles: Article[];
  readingProgress: number;
  isBookmarked: boolean;
  navigationArticles: {
    previous: Article | null;
    next: Article | null;
  };
}
```

### 4. Enhanced Article Card Component
**File:** `components/ArticleCard.tsx` (new)

**Features:**
- Consistent styling across all screens
- Proper icon implementation (outline style)
- Reading progress indicators
- Enhanced interaction states

## Data Models

### Enhanced Article Interface
```typescript
interface Article {
  id: string;
  title: string;
  description: string;
  content: string; // Full article content
  image: string;
  category: string;
  readTime: string;
  author: {
    name: string;
    avatar?: string;
  };
  publishDate: string;
  tags: string[];
  isFavorite: boolean;
  isBookmarked: boolean;
  viewCount: number;
  shareCount: number;
  relatedArticleIds: string[];
}
```

### Search and Filter State
```typescript
interface SearchFilterState {
  query: string;
  category: string;
  sortBy: 'newest' | 'popular' | 'trending';
  tags: string[];
}
```

### Reading Progress State
```typescript
interface ReadingProgressState {
  articleId: string;
  progress: number; // 0-100
  lastReadPosition: number;
  timeSpent: number;
}
```

## Error Handling

### Network Errors
- Implement retry mechanisms for article loading
- Show offline indicators when network is unavailable
- Cache articles for offline reading

### Navigation Errors
- Handle invalid article IDs gracefully
- Provide fallback navigation when articles are not found
- Maintain navigation state consistency

### Search Errors
- Handle empty search results with helpful suggestions
- Provide search query validation
- Show loading states during search operations

## Testing Strategy

### Unit Tests
- Article data transformation and filtering logic
- Search functionality and query processing
- Navigation state management
- Reading progress calculations

### Integration Tests
- Navigation flow between screens
- Category filtering across different views
- Search integration with article display
- Bookmark and favorite synchronization

### UI Tests
- Article card rendering and interactions
- Icon styling and visual consistency
- Responsive layout across different screen sizes
- Touch target accessibility

## Icon Implementation Guidelines

### Consistent Icon Styling
All icons must follow these specifications to avoid filled black icon issues:

```typescript
// Correct icon implementation
<IconName
  size={20}
  color={Colors.light.textLight}
  strokeWidth={1.5}
  fill="none" // Explicitly set to none for outline style
/>

// Avoid: Wrapped icons or missing strokeWidth
<Icon>
  <IconName size={20} color="#000000" />
</Icon>
```

### Icon Color Scheme
- Primary actions: `Colors.light.primary`
- Secondary actions: `Colors.light.textLight`
- Active states: `Colors.light.accent` or specific colors (e.g., red for favorites)
- Disabled states: `Colors.light.textLight` with reduced opacity

### Touch Targets
- Minimum 44x44 points for all interactive icons
- Proper padding around icons for comfortable tapping
- Visual feedback on press (opacity or color change)

## Performance Considerations

### Article Loading
- Implement lazy loading for article content
- Use image optimization for article thumbnails
- Cache frequently accessed articles

### Search Performance
- Debounce search queries to reduce API calls
- Implement client-side filtering for basic queries
- Use pagination for large result sets

### Navigation Performance
- Preload adjacent articles for smooth navigation
- Implement smooth transitions between screens
- Optimize scroll performance in article lists
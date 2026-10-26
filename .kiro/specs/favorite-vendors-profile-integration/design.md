# Design Document

## Overview

This design connects the existing standalone favorites page (`app/favorites.tsx`) to the profile page through improved navigation, enhanced UI components, and proper routing. The solution leverages the existing favorites functionality while adding seamless navigation paths and better user experience.

## Architecture

### Current State Analysis
- **Profile Page**: `app/(tabs)/profile.tsx` - Has a favorites section but limited functionality
- **Favorites Page**: `app/favorites.tsx` - Fully functional but not accessible via navigation
- **Store**: `stores/wedding-store.ts` - Contains favorites management logic
- **Routing**: Expo Router with stack navigation

### Connection Strategy
The connection will be established through:
1. **Navigation Links**: Add clickable elements in profile that route to `/favorites`
2. **Enhanced Profile Section**: Improve the existing favorites display in profile
3. **Routing Integration**: Ensure proper navigation stack and back button behavior
4. **State Synchronization**: Keep both pages in sync when favorites change

## Components and Interfaces

### 1. Profile Page Enhancements (`app/(tabs)/profile.tsx`)

#### Favorites Section Improvements
```typescript
interface ProfileFavoritesSection {
  // Navigation handlers
  onViewAllFavorites: () => void;
  onVendorPress: (vendorId: string) => void;
  onSectionHeaderPress: () => void;
  
  // Display properties
  maxDisplayCount: number; // Show max 3 vendors per category
  showViewAllButton: boolean; // When more than 3 total favorites
  showCategoryHeaders: boolean;
  
  // State management
  loading: boolean;
  favoriteVendors: Vendor[];
  favoritesByCategory: CategoryGroup[];
}

interface CategoryGroup {
  category: string;
  vendors: Vendor[];
  displayCount: number; // How many to show in profile (max 2 per category)
}
```

#### Navigation Methods
```typescript
// Navigate to full favorites page
const navigateToFavorites = () => {
  router.push('/favorites');
};

// Navigate to specific vendor
const navigateToVendor = (vendorId: string) => {
  router.push({
    pathname: "/vendor/[id]",
    params: { id: vendorId }
  });
};

// Handle section header tap
const handleFavoritesHeaderPress = () => {
  if (favoriteVendors.length > 0) {
    router.push('/favorites');
  } else {
    router.push('/(tabs)/vendors'); // Browse vendors if no favorites
  }
};
```

### 2. Favorites Page Integration (`app/favorites.tsx`)

#### Route Registration
The favorites page already exists but needs to be properly registered in the routing system:

```typescript
// Current: app/favorites.tsx (standalone)
// Solution: Ensure it's accessible via router.push('/favorites')
```

#### Back Navigation Enhancement
```typescript
// Add proper back navigation that returns to profile when coming from profile
const handleBackNavigation = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.push('/(tabs)/profile'); // Fallback to profile
  }
};
```

### 3. Enhanced UI Components

#### Profile Favorites Card Component
```typescript
interface ProfileFavoriteCard {
  vendor: Vendor;
  onPress: (vendorId: string) => void;
  compact: boolean; // Smaller size for profile display
  showCategory: boolean;
}

// Styling for profile context
const profileCardStyles = {
  width: 200, // Smaller than full favorites page
  height: 120,
  marginRight: 12,
  borderRadius: 8,
};
```

#### Section Header Component
```typescript
interface FavoritesSectionHeader {
  title: string;
  count: number;
  onPress: () => void;
  showViewAll: boolean;
}

// Example: "Favorite Vendors (8)" with tap to view all
```

## Data Models

### Favorites Display Model
```typescript
interface ProfileFavoritesDisplay {
  totalCount: number;
  categorizedVendors: {
    category: string;
    vendors: Vendor[];
    displayVendors: Vendor[]; // Limited for profile display
    hasMore: boolean;
  }[];
  isEmpty: boolean;
  isLoading: boolean;
}
```

### Navigation Context
```typescript
interface FavoritesNavigationContext {
  source: 'profile' | 'direct' | 'vendors';
  returnRoute?: string;
  vendorId?: string; // If navigating to specific vendor
}
```

## Error Handling

### Navigation Errors
- **Route Not Found**: Fallback to vendors page if favorites route fails
- **Back Navigation**: Ensure proper stack management
- **Deep Linking**: Handle direct access to favorites page

### Data Synchronization
- **State Updates**: Ensure profile reflects changes made in favorites page
- **Loading States**: Show appropriate loading indicators
- **Empty States**: Handle no favorites scenario gracefully

## Testing Strategy

### Navigation Testing
1. **Profile to Favorites**: Test navigation from profile favorites section
2. **Back Navigation**: Verify proper return to profile
3. **Vendor Navigation**: Test navigation to individual vendor pages
4. **Deep Links**: Test direct access to `/favorites` route

### UI Testing
1. **Responsive Display**: Test favorites section with different vendor counts
2. **Loading States**: Test loading indicators and empty states
3. **Category Grouping**: Verify proper categorization and display limits
4. **Touch Targets**: Ensure all interactive elements are accessible

### Integration Testing
1. **State Synchronization**: Test favorites changes reflect in both pages
2. **Route Persistence**: Test navigation stack and back button behavior
3. **Performance**: Test with large numbers of favorite vendors
4. **Error Recovery**: Test error scenarios and fallback behaviors

## Implementation Flow

### Phase 1: Navigation Setup
1. Add navigation handlers to profile favorites section
2. Ensure `/favorites` route is properly accessible
3. Implement back navigation from favorites to profile

### Phase 2: UI Enhancements
1. Enhance profile favorites section with better layout
2. Add "View All" button and section header interactions
3. Implement loading and empty states

### Phase 3: State Management
1. Ensure favorites data synchronization between pages
2. Add proper loading states and error handling
3. Implement refresh logic when returning from favorites

### Phase 4: Polish and Testing
1. Add smooth transitions and animations
2. Test all navigation paths and edge cases
3. Optimize performance and user experience

## Route Structure

```
Current Routes:
/(tabs)/profile     -> Profile page with favorites section
/favorites          -> Standalone favorites page (not connected)
/vendor/[id]        -> Individual vendor details

Enhanced Routes:
/(tabs)/profile     -> Profile page with enhanced favorites section
                      ├── Tap section header -> /favorites
                      ├── Tap "View All" -> /favorites  
                      └── Tap vendor card -> /vendor/[id]

/favorites          -> Full favorites page
                      ├── Back button -> return to previous page
                      └── Tap vendor -> /vendor/[id]
```

## User Experience Flow

1. **User opens Profile page**
   - Sees favorites section with up to 3 vendors per category
   - Section shows total count: "Favorite Vendors (8)"
   - Categories are clearly labeled

2. **User wants to see all favorites**
   - Taps section header OR "View All" button
   - Navigates to `/favorites` page
   - Sees full favorites page with existing functionality

3. **User manages favorites**
   - Uses existing favorites page features (grid/list view, remove favorites)
   - Taps back button to return to profile
   - Profile automatically reflects any changes made

4. **User accesses vendor details**
   - Can tap vendor cards from either profile or favorites page
   - Navigates to vendor detail page
   - Proper back navigation maintained
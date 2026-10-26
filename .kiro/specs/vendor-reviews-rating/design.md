# Design Document

## Overview

This design implements a comprehensive rate and review system for vendors in the ShaadiBazaar app. The feature adds a new "Reviews" tab to the vendor detail page, allowing users to view existing reviews, write new reviews with star ratings, and see aggregated rating statistics. The design integrates seamlessly with the existing vendor detail page architecture.

## Architecture

### Current State Analysis
- **Vendor Detail Page**: `app/vendor/[id].tsx` - Has tabs for "About" and "Packages"
- **Vendor Data Model**: Contains basic rating and reviewCount fields
- **Store**: `stores/wedding-store.ts` - Manages vendor data
- **Database**: Supabase backend for data persistence

### Enhanced Architecture
The reviews system will extend the existing architecture with:
1. **New Reviews Tab**: Added to existing tab navigation
2. **Review Data Models**: New schemas for reviews and ratings
3. **Review Components**: Reusable components for rating display and input
4. **Review Store Actions**: New store methods for review management
5. **Database Tables**: New Supabase tables for reviews storage

## Components and Interfaces

### 1. Reviews Tab Component (`components/ReviewsTab.tsx`)

```typescript
interface ReviewsTabProps {
  vendorId: string;
  averageRating: number;
  totalReviews: number;
}

interface ReviewsTabState {
  reviews: Review[];
  loading: boolean;
  showReviewForm: boolean;
  userReview: Review | null;
}
```

#### Layout Structure
```
ReviewsTab
├── ReviewSummary
│   ├── AverageRating (stars + number)
│   ├── TotalReviews count
│   └── RatingDistribution (5-star breakdown)
├── WriteReviewButton
├── ReviewList
│   └── ReviewItem (for each review)
└── ReviewFormModal
```

### 2. Star Rating Component (`components/StarRating.tsx`)

```typescript
interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

// Usage examples:
// <StarRating rating={4.5} size="medium" /> // Display only
// <StarRating rating={0} interactive onRatingChange={setRating} /> // Input
```

#### Visual Design
- **Display Mode**: Filled stars for whole numbers, half-filled for decimals
- **Interactive Mode**: Tap to select rating, visual feedback on touch
- **Sizes**: Small (12px), Medium (16px), Large (24px)

### 3. Review Form Modal (`components/ReviewFormModal.tsx`)

```typescript
interface ReviewFormModalProps {
  visible: boolean;
  vendorId: string;
  existingReview?: Review;
  onClose: () => void;
  onSubmit: (review: ReviewInput) => void;
}

interface ReviewInput {
  rating: number;
  title: string;
  content: string;
  vendorId: string;
}
```

#### Form Layout
```
Modal
├── Header ("Write Review" / "Edit Review")
├── VendorInfo (name, category)
├── RatingInput (interactive stars)
├── TitleInput (optional short title)
├── ContentInput (multiline text)
├── CharacterCount (max 500 chars)
└── Actions (Cancel, Submit)
```

### 4. Review Item Component (`components/ReviewItem.tsx`)

```typescript
interface ReviewItemProps {
  review: Review;
  isUserReview: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onHelpful?: (helpful: boolean) => void;
}
```

#### Review Item Layout
```
ReviewItem
├── Header
│   ├── UserInitials (avatar)
│   ├── StarRating (display)
│   └── Date + EditedIndicator
├── Content
│   ├── Title (if provided)
│   ├── ReviewText (with Read More)
│   └── HelpfulVoting (thumbs up/down)
└── Actions (Edit/Delete if user's review)
```

## Data Models

### Review Schema
```typescript
interface Review {
  id: string;
  vendorId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  helpful: number; // net helpful votes
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  userInitials: string;
  timeAgo: string;
}
```

### Rating Distribution
```typescript
interface RatingDistribution {
  5: number; // count of 5-star reviews
  4: number; // count of 4-star reviews
  3: number; // count of 3-star reviews
  2: number; // count of 2-star reviews
  1: number; // count of 1-star reviews
  total: number;
  average: number;
}
```

### Updated Vendor Model
```typescript
interface Vendor {
  // ... existing fields
  rating: number; // computed from reviews
  reviewCount: number; // computed from reviews
  ratingDistribution: RatingDistribution;
}
```

## Error Handling

### Review Submission Errors
- **Network Errors**: Show retry option with offline queue
- **Validation Errors**: Highlight required fields
- **Duplicate Review**: Prevent multiple reviews per user per vendor
- **Content Moderation**: Basic profanity filtering

### Data Loading Errors
- **Reviews Load Failure**: Show error state with retry button
- **Empty States**: Encouraging messages for first review
- **Pagination Errors**: Graceful handling of load more failures

## Testing Strategy

### Component Testing
1. **StarRating Component**: Test interactive and display modes
2. **ReviewForm**: Test validation, submission, and error states
3. **ReviewItem**: Test display, edit/delete actions
4. **ReviewsTab**: Test tab switching, data loading

### Integration Testing
1. **Review Submission Flow**: End-to-end review creation
2. **Rating Updates**: Verify vendor rating updates after review
3. **User Review Management**: Test edit/delete functionality
4. **Review Filtering**: Test review sorting and pagination

### Data Testing
1. **Review CRUD Operations**: Create, read, update, delete reviews
2. **Rating Calculations**: Verify average rating computations
3. **Review Validation**: Test input validation and sanitization
4. **Concurrent Reviews**: Test multiple users reviewing same vendor

## Implementation Details

### Database Schema (Supabase)

```sql
-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL CHECK (length(content) <= 500),
  helpful INTEGER DEFAULT 0,
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(vendor_id, user_id) -- One review per user per vendor
);

-- Review helpful votes table
CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Indexes for performance
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_review_votes_review_id ON review_votes(review_id);
```

### Store Actions (Wedding Store)

```typescript
// New store actions for reviews
interface ReviewActions {
  loadReviews: (vendorId: string) => Promise<Review[]>;
  submitReview: (review: ReviewInput) => Promise<{ success: boolean; error?: string }>;
  updateReview: (reviewId: string, updates: Partial<ReviewInput>) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (reviewId: string) => Promise<{ success: boolean; error?: string }>;
  voteReviewHelpful: (reviewId: string, helpful: boolean) => Promise<{ success: boolean; error?: string }>;
  calculateVendorRating: (vendorId: string) => Promise<RatingDistribution>;
}
```

### Tab Integration

The Reviews tab will be added to the existing tab system in `app/vendor/[id].tsx`:

```typescript
// Add to existing tabs
const tabs = ["about", "packages", "reviews"];

// Add to tab rendering
<TouchableOpacity
  style={[styles.tab, selectedTab === "reviews" && styles.activeTab]}
  onPress={() => setSelectedTab("reviews")}
>
  <Text style={[styles.tabText, selectedTab === "reviews" && styles.activeTabText]}>
    Reviews ({vendor.reviewCount})
  </Text>
</TouchableOpacity>
```

## User Experience Flow

### Viewing Reviews
1. **User opens vendor detail page**
2. **User taps "Reviews" tab**
3. **System loads reviews and rating summary**
4. **User sees rating distribution and review list**
5. **User can scroll through reviews, vote helpful**

### Writing a Review
1. **User taps "Write Review" button**
2. **Review form modal opens**
3. **User selects star rating (required)**
4. **User writes review text (required)**
5. **User submits review**
6. **System validates and saves review**
7. **Reviews tab updates with new review**
8. **Vendor rating updates automatically**

### Managing Own Review
1. **User sees their existing review with edit/delete options**
2. **User taps edit → form opens with existing data**
3. **User taps delete → confirmation dialog appears**
4. **System updates review and recalculates vendor rating**

## Visual Design Guidelines

### Color Scheme
- **Star Rating**: Gold (#FFD700) for filled stars, light gray for empty
- **Review Cards**: White background with subtle border
- **Helpful Votes**: Green for positive, red for negative
- **User Actions**: Primary blue for buttons, red for delete

### Typography
- **Rating Numbers**: Bold, larger font for emphasis
- **Review Content**: Regular body text, good line height
- **Dates**: Smaller, muted text
- **User Names**: Medium weight, readable size

### Spacing and Layout
- **Card Spacing**: 16px between review cards
- **Internal Padding**: 16px inside cards
- **Star Spacing**: 4px between individual stars
- **Button Spacing**: 12px between action buttons
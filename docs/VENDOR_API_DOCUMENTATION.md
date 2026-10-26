# 🏪 Complete Vendor API Documentation

Comprehensive reference for all vendor-related APIs in ShaadiBazaar.

## 🎯 Overview

Your app now includes **ALL** vendor management features:
- ✅ **Vendor CRUD Operations** (Create, Read, Update, Delete)
- ✅ **Advanced Search & Filtering** with geolocation
- ✅ **Review & Rating System**
- ✅ **Booking Management**
- ✅ **Communication System**
- ✅ **Real-time Features**

## 🏪 Vendor Management APIs

### `useVendorStore`

#### Core Vendor Operations

```typescript
// Load all vendors
await loadVendors();

// Create new vendor
const result = await createVendor({
  name: "Dream Decorators",
  category: "Decoration",
  description: "Beautiful wedding decorations",
  location: {
    address: "123 Decor Street",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400001",
    latitude: 19.0760,
    longitude: 72.8777
  },
  priceRange: "₹50,000 - ₹2,00,000",
  minPrice: 50000,
  maxPrice: 200000,
  coverImage: "https://example.com/image.jpg",
  photos: ["https://example.com/photo1.jpg"],
  contact: {
    phone: "+91-9876543213",
    email: "info@dreamdecorators.com"
  },
  isAvailable: true,
  featured: false
});
// Returns: { success: boolean; vendor?: Vendor; error?: string }

// Update vendor
const result = await updateVendor(vendorId, {
  name: "Updated Name",
  priceRange: "₹60,000 - ₹2,50,000"
});
// Returns: { success: boolean; error?: string }

// Delete vendor
const result = await deleteVendor(vendorId);
// Returns: { success: boolean; error?: string }

// Get vendor by ID
const vendor = getVendorById(vendorId);
// Returns: Vendor | null
```

## 🔍 Advanced Search & Filtering

### Location-Based Search

```typescript
// Search by location with radius
const result = await searchVendorsByLocation(
  {
    address: "Mumbai Central",
    city: "Mumbai", 
    state: "Maharashtra",
    country: "India",
    pincode: "400008",
    latitude: 19.0176,
    longitude: 72.8562
  },
  10 // radius in km
);
// Returns: { success: boolean; vendors?: Vendor[]; error?: string }

// Calculate distance between locations
const distance = calculateDistance(location1, location2);
// Returns: number (distance in km)
```

### Advanced Filtering

```typescript
// Comprehensive search with filters
const result = await searchVendors({
  query: "photography",
  category: "Photography",
  location: {
    city: "Mumbai",
    radius: 15,
    latitude: 19.0760,
    longitude: 72.8777
  },
  priceRange: {
    min: 50000,
    max: 200000
  },
  rating: 4.0,
  availability: {
    date: "2024-12-25T00:00:00Z",
    isAvailable: true
  },
  features: ["drone", "candid"],
  verified: true,
  sortBy: "rating",
  sortOrder: "desc",
  limit: 20,
  offset: 0
});

// Filter by price range
const result = await filterVendorsByPrice(50000, 200000);

// Filter by rating
const result = await filterVendorsByRating(4.0);

// Sort vendors
const sortedVendors = sortVendors(
  vendors, 
  "rating", // 'rating' | 'price' | 'distance' | 'popularity'
  "desc"    // 'asc' | 'desc'
);
```

## ⭐ Review & Rating System

```typescript
// Load vendor reviews
await loadVendorReviews(vendorId);

// Add review
const result = await addVendorReview({
  vendorId: "vendor-123",
  userId: "user-456", 
  userName: "John Doe",
  rating: 5,
  comment: "Excellent service! Highly recommended.",
  photos: ["https://example.com/review-photo.jpg"]
});
// Returns: { success: boolean; error?: string }

// Update review
const result = await updateVendorReview(reviewId, {
  rating: 4,
  comment: "Updated review comment"
});

// Delete review
const result = await deleteVendorReview(reviewId);
```

## 📅 Booking Management

```typescript
// Check vendor availability
const result = await checkVendorAvailability(
  vendorId, 
  "2024-12-25T18:00:00Z"
);
// Returns: { success: boolean; available?: boolean; error?: string }

// Book vendor
const result = await bookVendor({
  vendorId: "vendor-123",
  userId: "user-456",
  eventDate: "2024-12-25T18:00:00Z",
  eventType: "Wedding",
  packageId: "premium-package",
  customRequirements: "Need extra lighting setup",
  totalAmount: 150000,
  advanceAmount: 50000,
  status: "pending",
  paymentStatus: "partial",
  bookingDate: new Date().toISOString(),
  notes: "Evening ceremony"
});
// Returns: { success: boolean; booking?: VendorBooking; error?: string }

// Update booking status
const result = await updateBookingStatus(bookingId, "confirmed");

// Cancel booking
const result = await cancelBooking(bookingId);

// Load user bookings
await loadUserBookings(userId);
```

## 💬 Communication System

```typescript
// Send inquiry to vendor
const result = await sendInquiry({
  vendorId: "vendor-123",
  userId: "user-456",
  userName: "John Doe",
  userEmail: "john@example.com",
  userPhone: "+91-9876543210",
  subject: "Wedding Photography Inquiry",
  message: "Hi, I'm interested in your photography services for my wedding on Dec 25th.",
  eventDate: "2024-12-25T18:00:00Z",
  eventType: "Wedding",
  budget: 100000,
  status: "new"
});
// Returns: { success: boolean; inquiry?: VendorInquiry; error?: string }

// Load user inquiries
await loadUserInquiries(userId);

// Update inquiry status
const result = await updateInquiryStatus(inquiryId, "read");

// Reply to inquiry (vendor side)
const result = await replyToInquiry(
  inquiryId, 
  "Thank you for your inquiry! We'd love to discuss your wedding photography needs."
);
```

## 💝 Favorites Management

```typescript
// Toggle vendor favorite
const result = await toggleFavoriteVendor(vendorId);
// Returns: { success: boolean; error?: string }

// Load user's favorite vendors
await loadFavoriteVendors(userId);
```

## 🎯 Type Definitions

### Enhanced Vendor Types

```typescript
interface VendorLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

interface VendorAvailability {
  date: string;
  isAvailable: boolean;
  timeSlots?: {
    startTime: string;
    endTime: string;
    isBooked: boolean;
  }[];
}

interface VendorReview {
  id: string;
  vendorId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  photos?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface VendorBooking {
  id: string;
  vendorId: string;
  userId: string;
  eventDate: string;
  eventType: string;
  packageId?: string;
  customRequirements?: string;
  totalAmount: number;
  advanceAmount?: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded';
  bookingDate: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

interface VendorInquiry {
  id: string;
  vendorId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  message: string;
  eventDate?: string;
  eventType?: string;
  budget?: number;
  status: 'new' | 'read' | 'replied' | 'closed';
  vendorResponse?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt?: string;
}

interface VendorSearchFilters {
  query?: string;
  category?: string;
  location?: {
    city?: string;
    state?: string;
    radius?: number; // in km
    latitude?: number;
    longitude?: number;
  };
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  availability?: {
    date?: string;
    isAvailable?: boolean;
  };
  features?: string[];
  verified?: boolean;
  sortBy?: 'rating' | 'price' | 'distance' | 'popularity' | 'newest';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
```

## 🛠️ Usage Examples

### Complete Vendor Search Workflow

```typescript
import { useVendorStore } from '@/stores/vendor-store';

function VendorSearchComponent() {
  const { 
    searchVendors, 
    searchVendorsByLocation,
    sortVendors,
    vendors,
    loading 
  } = useVendorStore();
  
  const searchNearbyPhotographers = async () => {
    // Search photographers within 10km of user location
    const result = await searchVendorsByLocation(
      {
        address: "Current Location",
        city: "Mumbai",
        state: "Maharashtra", 
        country: "India",
        pincode: "400001",
        latitude: 19.0760,
        longitude: 72.8777
      },
      10
    );
    
    if (result.success && result.vendors) {
      // Sort by rating
      const sortedVendors = sortVendors(
        result.vendors.filter(v => v.category === 'Photography'),
        'rating',
        'desc'
      );
      
      console.log('Top photographers nearby:', sortedVendors);
    }
  };
}
```

### Complete Booking Workflow

```typescript
function BookingWorkflow() {
  const { 
    checkVendorAvailability,
    bookVendor,
    sendInquiry 
  } = useVendorStore();
  
  const bookPhotographer = async (vendorId: string) => {
    // 1. Check availability
    const availability = await checkVendorAvailability(
      vendorId,
      "2024-12-25T18:00:00Z"
    );
    
    if (!availability.available) {
      console.log('Vendor not available on this date');
      return;
    }
    
    // 2. Send inquiry first
    await sendInquiry({
      vendorId,
      userId: "current-user-id",
      userName: "John Doe",
      userEmail: "john@example.com",
      subject: "Wedding Photography Booking",
      message: "I'd like to book your services for my wedding",
      eventDate: "2024-12-25T18:00:00Z",
      eventType: "Wedding",
      budget: 150000
    });
    
    // 3. After vendor confirms, make booking
    const booking = await bookVendor({
      vendorId,
      userId: "current-user-id", 
      eventDate: "2024-12-25T18:00:00Z",
      eventType: "Wedding",
      totalAmount: 150000,
      advanceAmount: 50000,
      status: "pending",
      paymentStatus: "partial",
      bookingDate: new Date().toISOString()
    });
    
    if (booking.success) {
      console.log('Booking created successfully!');
    }
  };
}
```

## 🚀 Production Features

Your vendor system now includes:

- ✅ **Geolocation Search** with radius filtering
- ✅ **Advanced Filtering** by price, rating, availability
- ✅ **Real-time Reviews** with photo uploads
- ✅ **Complete Booking System** with status tracking
- ✅ **Inquiry Management** for vendor communication
- ✅ **Favorites System** with persistence
- ✅ **Type Safety** with runtime validation
- ✅ **Database Optimization** with proper indexing
- ✅ **Security** with Row Level Security (RLS)

Your ShaadiBazaar app now has **enterprise-grade vendor management**! 🎉

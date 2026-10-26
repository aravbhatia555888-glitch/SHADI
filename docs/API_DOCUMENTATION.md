# 📚 ShaadiBazaar API Documentation

Complete reference for all implemented APIs in your wedding planning app.

## 🔐 Authentication APIs

### `useAuthStore`

#### Core Methods

```typescript
// Sign in user
const result = await signIn({ 
  email: string, 
  password: string 
});
// Returns: { success: boolean; error?: string }

// Sign up new user
const result = await signUp({
  email: string,
  password: string,
  name: string,
  confirmPassword: string
});
// Returns: { success: boolean; error?: string }

// Reset password
const result = await resetPassword({ 
  email: string 
});
// Returns: { success: boolean; error?: string }

// Update user profile
const result = await updateProfile({
  name?: string,
  weddingDate?: string,
  partner?: { name: string; email: string }
});
// Returns: { success: boolean; error?: string }

// Change password
const result = await changePassword(
  currentPassword: string,
  newPassword: string
);
// Returns: { success: boolean; error?: string }

// Delete account
const result = await deleteAccount();
// Returns: { success: boolean; error?: string }

// Logout
await logout();

// Initialize auth store
await initialize();

// Refresh user data
await refreshUser();

// Clear error state
clearError();
```

#### State Properties

```typescript
{
  user: User | null;           // Current user data
  loading: boolean;            // Loading state
  error: string | null;        // Error message
  isInitialized: boolean;      // Initialization status
}
```

## 💒 Wedding Planning APIs

### `useWeddingStore`

#### Wedding Details

```typescript
// Set wedding details
const result = await setWeddingDetails({
  coupleName: string,
  weddingDate: string,
  weddingLocation: string,
  totalBudget: number
});
// Returns: { success: boolean; error?: string }
```

#### Vendor Management

```typescript
// Load all vendors
await loadVendors();

// Search vendors
const result = await searchVendors(
  query: string,
  category?: string
);
// Returns: { success: boolean; vendors?: Vendor[]; error?: string }

// Toggle vendor favorite
const result = await toggleFavoriteVendor(vendorId: string);
// Returns: { success: boolean; error?: string }

// Load user's favorite vendors
await loadFavoriteVendors(userId: string);
```

#### Checklist Management

```typescript
// Load checklist items
await loadChecklistItems(userId: string);

// Add checklist item
const result = await addChecklistItem({
  title: string,
  description: string,
  category: string,
  dueDate: string,
  completed: boolean,
  priority: 'high' | 'medium' | 'low'
});
// Returns: { success: boolean; error?: string }

// Update checklist item
const result = await updateChecklistItem(
  itemId: string,
  completed: boolean
);
// Returns: { success: boolean; error?: string }

// Delete checklist item
const result = await deleteChecklistItem(itemId: string);
// Returns: { success: boolean; error?: string }
```

#### Budget Management

```typescript
// Load budget items
await loadBudgetItems(userId: string);

// Add budget category
const result = await addBudgetCategory({
  category: string,
  estimated: number
});
// Returns: { success: boolean; error?: string }

// Update budget item
const result = await updateBudgetItem(
  itemId: string,
  estimated: number
);
// Returns: { success: boolean; error?: string }

// Add budget expense
const result = await addBudgetExpense(budgetItemId: string, {
  name: string,
  amount: number,
  date: string,
  paid: boolean,
  vendor?: string,
  notes?: string
});
// Returns: { success: boolean; error?: string }

// Delete budget expense
const result = await deleteBudgetExpense(
  expenseId: string,
  budgetItemId: string
);
// Returns: { success: boolean; error?: string }
```

#### Real-time Features

```typescript
// Subscribe to real-time changes
subscribeToChanges(userId: string);

// Unsubscribe from changes
unsubscribeFromChanges();
```

#### State Properties

```typescript
{
  weddingDetails: WeddingDetails | null;  // Wedding info
  vendors: Vendor[];                      // All vendors
  favoriteVendors: string[];              // Favorite vendor IDs
  checklistItems: ChecklistItem[];        // Checklist items
  budgetItems: BudgetItem[];              // Budget categories
  loading: boolean;                       // Loading state
  error: string | null;                   // Error message
  isInitialized: boolean;                 // Initialization status
}
```

## 🎯 Type Definitions

### User Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  weddingDate?: string;
  partner?: {
    name: string;
    email: string;
  };
}
```

### Wedding Types

```typescript
interface WeddingDetails {
  id?: string;
  coupleName: string;
  weddingDate: string;
  weddingLocation: string;
  totalBudget: number;
}

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  coverImage: string;
  photos: string[];
  // ... more properties
}

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface BudgetItem {
  id: string;
  category: string;
  estimated: number;
  spent: number;
  items: BudgetExpense[];
}

interface BudgetExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  paid: boolean;
  vendor?: string;
  notes?: string;
}
```

## 🛠️ Usage Examples

### Complete Authentication Flow

```typescript
import { useAuthStore } from '@/stores/auth-store';

function LoginComponent() {
  const { signIn, loading, error } = useAuthStore();
  
  const handleLogin = async () => {
    const result = await signIn({
      email: 'user@example.com',
      password: 'password123'
    });
    
    if (result.success) {
      // Navigate to main app
    } else {
      // Show error: result.error
    }
  };
}
```

### Wedding Planning Workflow

```typescript
import { useWeddingStore } from '@/stores/wedding-store';

function WeddingPlanningComponent() {
  const { 
    setWeddingDetails, 
    addChecklistItem, 
    addBudgetExpense 
  } = useWeddingStore();
  
  const setupWedding = async () => {
    // Set wedding details
    await setWeddingDetails({
      coupleName: 'John & Jane',
      weddingDate: '2024-12-25T18:00:00Z',
      weddingLocation: 'Mumbai, India',
      totalBudget: 500000
    });
    
    // Add checklist item
    await addChecklistItem({
      title: 'Book venue',
      description: 'Find and book wedding venue',
      category: 'Venue',
      dueDate: '2024-06-01T00:00:00Z',
      completed: false,
      priority: 'high'
    });
    
    // Add budget expense
    await addBudgetExpense('venue-category-id', {
      name: 'Venue booking deposit',
      amount: 50000,
      date: '2024-05-01T00:00:00Z',
      paid: true,
      vendor: 'Royal Palace Banquets'
    });
  };
}
```

## 🔄 Real-time Features

Your app supports real-time collaboration:

- **Live checklist updates** when multiple users edit
- **Real-time budget tracking** with instant sync
- **Collaborative planning** between partners
- **Vendor favorites** sync across devices

## 🧪 Testing APIs

Use the built-in API validator:

```typescript
import { apiValidator } from '@/utils/api-validator';

// Test all APIs
const results = await apiValidator.testAllAPIs();
console.log('API Test Results:', results);

// Test specific API groups
const authResults = await apiValidator.testAuthAPIs();
const weddingResults = await apiValidator.testWeddingAPIs();
```

## 🚀 Production Ready

All APIs include:
- ✅ **Runtime validation** with Zod schemas
- ✅ **Error handling** with user-friendly messages
- ✅ **Type safety** with TypeScript
- ✅ **Real-time sync** with Supabase
- ✅ **Offline fallback** to mock data
- ✅ **Security** with Row Level Security (RLS)

Your ShaadiBazaar app is now enterprise-ready! 🎉

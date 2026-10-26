# 🧪 Testing Mode - Image Upload Without Authentication

## 🎯 What's This?

Your ShaadiBazaar app is now in **TESTING MODE** for image uploads! This means:

- ✅ **No login required** - test immediately
- ✅ **No Supabase setup needed** - works offline
- ✅ **Real image picker** - camera and gallery work
- ✅ **Local image storage** - images saved to device
- ✅ **Full UI/UX testing** - all features work

## 🚀 How to Test

### **1. Start Your App**
```bash
npm start
```

### **2. Test Profile Image Upload**
1. **Go to Profile tab**
2. **Tap "Edit" button** on profile image
3. **Choose option**:
   - "Take Photo" - opens camera
   - "Choose from Gallery" - opens photo library
4. **Select/take image**
5. **See success message** ✅
6. **Image updates immediately** in profile

### **3. What Happens in Testing Mode**
- **Image picker works** - real camera/gallery access
- **Local storage** - images saved to device temporarily
- **No cloud upload** - no internet required
- **State management** - image URL saved in app state
- **Success feedback** - alerts and UI updates work

## 🔧 Technical Details

### **Testing Mode Configuration**

**File: `services/imageUpload.ts`**
```typescript
// Testing mode - set to true to bypass Supabase
private static TESTING_MODE = true;
```

**File: `stores/wedding-store.ts`**
```typescript
// In testing mode, just update local state
const TESTING_MODE = true;
```

### **What's Different in Testing Mode**

| Feature | Testing Mode | Production Mode |
|---------|-------------|-----------------|
| **Authentication** | ❌ Not required | ✅ Required |
| **Image Upload** | 📱 Local device | ☁️ Supabase Storage |
| **Data Storage** | 💾 App state only | 🗄️ Database + state |
| **Internet** | ❌ Not required | ✅ Required |
| **Setup** | ❌ None needed | ✅ Supabase config |

## 📱 Testing Checklist

### **✅ Image Selection**
- [ ] **Gallery picker** opens correctly
- [ ] **Camera** opens and takes photos
- [ ] **Image cropping** works (square aspect)
- [ ] **Permissions** requested properly

### **✅ UI/UX**
- [ ] **Loading states** show during processing
- [ ] **Success alerts** appear after upload
- [ ] **Error handling** works for cancelled actions
- [ ] **Image updates** immediately in profile

### **✅ State Management**
- [ ] **Profile image** persists during app session
- [ ] **Store updates** work correctly
- [ ] **Console logs** show testing mode messages

## 🔄 Switch to Production Mode

When ready for real Supabase integration:

### **1. Update Testing Flags**
```typescript
// services/imageUpload.ts
private static TESTING_MODE = false;

// stores/wedding-store.ts  
const TESTING_MODE = false;
```

### **2. Set Up Supabase**
Follow the `SUPABASE_SETUP.md` guide:
- Create storage bucket
- Set up policies
- Configure authentication

### **3. Add Real Authentication**
```typescript
// Add real user authentication
const { data: { user } } = await supabase.auth.getUser();
```

## 🐛 Troubleshooting

### **Issue: "Permission denied"**
**Solution**: Grant camera/gallery permissions when prompted

### **Issue: "Image not updating"**
**Solution**: Check console logs for testing mode messages

### **Issue: "App crashes on image select"**
**Solution**: Ensure expo-image-picker is installed correctly

### **Issue: "No success message"**
**Solution**: Check Alert permissions on device

## 📋 Console Output

In testing mode, you'll see these logs:
```
Mock upload to images/profile/demo-user-123-timestamp.jpg
Testing mode: Profile image updated locally: file://...
Image upload error: [any errors]
```

## 🎯 Benefits of Testing Mode

1. **Immediate Testing** - no setup required
2. **Offline Development** - works without internet
3. **UI/UX Focus** - test user experience first
4. **No Authentication Hassle** - skip login flows
5. **Real Device Testing** - actual camera/gallery access

## 🚀 Next Steps

1. **Test thoroughly** in testing mode
2. **Verify all UI flows** work correctly
3. **Check error handling** scenarios
4. **When satisfied**, switch to production mode
5. **Set up real Supabase** for cloud storage

## ⚠️ Important Notes

- **Testing mode images** are temporary (lost on app restart)
- **No real cloud storage** in testing mode
- **Switch to production** for persistent storage
- **Authentication will be required** in production mode

Your app is ready for immediate testing! 🎉
